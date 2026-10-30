"""Copy only Dewey and Geo rows from Logosphere v1.0 to Logosphere BITS.

The source project is queried with SELECT only. The target is changed in
atomic, verified batches. No source IDs, credentials, or dataset rows are
stored in this file or in the repository.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path


SOURCE_REF = "vtcgignwusltcaehjkvw"
TARGET_REF = "hyttefgicgrmnhghuzap"
CLI = Path(os.environ.get("APPDATA", "")) / "npm" / "supabase.cmd"
NAMESPACE = uuid.NAMESPACE_URL
TABLES = ("dewey_nodes", "geo_nodes")
COLUMNS = {
    "dewey_nodes": ("id", "parent_id", "code", "name_en", "name_tr"),
    "geo_nodes": (
        "id", "parent_id", "code", "level", "name", "country_code", "postal_code"
    ),
}
TYPES = {
    "dewey_nodes": "id uuid, parent_id uuid, code text, name_en text, name_tr text",
    "geo_nodes": (
        "id uuid, parent_id uuid, code text, level text, name text, "
        "country_code text, postal_code text"
    ),
}


def mapped_id(table: str, old_id: int) -> str:
    return str(uuid.uuid5(NAMESPACE, f"logosphere-bits:{SOURCE_REF}:{table}:{old_id}"))


def run_query(project_ref: str, sql: str) -> list[dict]:
    if project_ref not in (SOURCE_REF, TARGET_REF):
        raise RuntimeError("Unexpected Supabase project reference")
    if project_ref == SOURCE_REF and not sql.lstrip().lower().startswith("select "):
        raise RuntimeError("Source project accepts SELECT queries only")
    if not CLI.is_file():
        raise RuntimeError("Supabase CLI launcher was not found")
    # Passing a file avoids shell quoting and command-line exposure of row data.
    with tempfile.TemporaryDirectory(prefix="bits-transfer-") as temp_dir:
        sql_path = Path(temp_dir) / "query.sql"
        sql_path.write_text(sql, encoding="utf-8")
        command = [
            str(CLI), "db", "query", "--linked", "--project-ref", project_ref,
            "--output-format", "json", "--file", str(sql_path),
        ]
        result = subprocess.run(
            command, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=180, check=False,
        )
    output = result.stdout + "\n" + result.stderr
    start = output.find("{")
    parsed = None
    if start >= 0:
        try:
            parsed, _ = json.JSONDecoder().raw_decode(output[start:])
        except json.JSONDecodeError:
            pass
    if result.returncode != 0 or not isinstance(parsed, dict) or "error" in parsed:
        code = (parsed or {}).get("error", {}).get("code", "unknown")
        raise RuntimeError(
            f"Supabase query failed for {project_ref}; code={code}; "
            "batch was rolled back if it reached PostgreSQL"
        )
    if "rows" not in parsed or not isinstance(parsed["rows"], list):
        raise RuntimeError(f"Supabase returned an unexpected result for {project_ref}")
    return parsed["rows"]


def source_metrics(table: str) -> dict:
    query = (
        "select count(*)::bigint as total, min(s.id) as min_id, "
        "max(s.id) as max_id, count(distinct s.code)::bigint as codes, "
        "count(*) filter (where s.code is null or btrim(s.code) = '')::bigint "
        "as blank_codes, count(*) filter (where s.parent_id is null)::bigint "
        "as roots, count(*) filter (where s.parent_id >= s.id)::bigint "
        "as unordered_parents, count(*) filter "
        "(where s.parent_id is not null and p.id is null)::bigint as orphans "
        f"from public.{table} s left join public.{table} p on p.id = s.parent_id"
    )
    rows = run_query(SOURCE_REF, query)
    if len(rows) != 1:
        raise RuntimeError(f"Unexpected source metrics for {table}")
    return rows[0]


def target_metrics(table: str) -> dict:
    query = (
        "select count(*)::bigint as total, count(distinct t.code)::bigint as codes, "
        "count(*) filter (where t.parent_id is null)::bigint as roots, "
        "count(*) filter (where t.parent_id is not null and p.id is null)::bigint "
        f"as orphans from public.{table} t "
        f"left join public.{table} p on p.id = t.parent_id"
    )
    rows = run_query(TARGET_REF, query)
    if len(rows) != 1:
        raise RuntimeError(f"Unexpected target metrics for {table}")
    return rows[0]


def source_page(table: str, last_id: int, batch_size: int) -> list[dict]:
    columns = ", ".join(COLUMNS[table])
    query = (
        f"select {columns} from public.{table} "
        f"where id > {last_id} order by id limit {batch_size}"
    )
    return run_query(SOURCE_REF, query)


def convert_page(table: str, source_rows: list[dict]) -> list[dict]:
    converted = []
    for source in source_rows:
        old_id = int(source["id"])
        parent = source["parent_id"]
        new_row = {
            "id": mapped_id(table, old_id),
            "parent_id": mapped_id(table, int(parent)) if parent is not None else None,
            "code": source["code"],
        }
        if table == "dewey_nodes":
            new_row.update(name_en=source["name_en"], name_tr=source["name_tr"])
        else:
            new_row.update(
                level=source["level"], name=source["name"],
                country_code=source["country_code"],
                postal_code=source["postal_code"],
            )
        converted.append(new_row)
    return converted


def write_batch(table: str, rows: list[dict]) -> None:
    encoded = base64.b64encode(
        json.dumps(rows, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    ).decode("ascii")
    columns = ", ".join(COLUMNS[table])
    differing = " or ".join(
        f"t.{column} is distinct from r.{column}"
        for column in COLUMNS[table] if column != "id"
    )
    updates = ", ".join(
        f"{column} = excluded.{column}"
        for column in COLUMNS[table] if column != "id"
    )
    verify = differing
    sql = f"""
do $bits_transfer$
declare
  payload jsonb := convert_from(decode('{encoded}', 'base64'), 'UTF8')::jsonb;
  mismatch_count bigint;
begin
  insert into public.{table} as t ({columns})
  select {columns}
  from jsonb_to_recordset(payload) as r({TYPES[table]})
  on conflict (id) do update
  set {updates}, updated_at = now()
  where {differing.replace('r.', 'excluded.')};

  select count(*) into mismatch_count
  from jsonb_to_recordset(payload) as r({TYPES[table]})
  left join public.{table} t on t.id = r.id
  where t.id is null or {verify};
  if mismatch_count <> 0 then
    raise exception 'transfer batch verification failed for {table}: % rows',
      mismatch_count;
  end if;
end
$bits_transfer$;
"""
    run_query(TARGET_REF, sql)


def transfer_table(table: str, batch_size: int, max_rows: int | None,
                   resume: bool) -> None:
    before = source_metrics(table)
    target_before = target_metrics(table)
    total = int(before["total"])
    if int(before["blank_codes"]) or int(before["orphans"]) or int(before["unordered_parents"]):
        raise RuntimeError(f"Source {table} failed preflight checks")
    if int(before["codes"]) != total:
        raise RuntimeError(f"Source {table} codes are not unique")
    if int(target_before["total"]) and not resume:
        raise RuntimeError(f"Target {table} is not empty; use --resume only after review")
    print(f"{table}: source={total}, target_before={target_before['total']}, "
          f"roots={before['roots']}", flush=True)

    last_id = 0
    processed = 0
    while True:
        allowance = min(batch_size, max_rows - processed) if max_rows else batch_size
        if allowance <= 0:
            break
        page = source_page(table, last_id, allowance)
        if not page:
            break
        ids = [int(row["id"]) for row in page]
        if ids != sorted(set(ids)) or ids[0] <= last_id:
            raise RuntimeError(f"Source {table} page order changed")
        if any(row["parent_id"] is not None and int(row["parent_id"]) >= int(row["id"])
               for row in page):
            raise RuntimeError(f"Source {table} parent order changed")
        write_batch(table, convert_page(table, page))
        processed += len(page)
        last_id = ids[-1]
        if processed % (batch_size * 5) == 0 or len(page) < allowance:
            print(f"{table}: processed={processed}/{total}, last_source_id={last_id}",
                  flush=True)
        if len(page) < allowance:
            break

    if max_rows is None and processed != total:
        raise RuntimeError(f"Source {table} changed during transfer: {processed}/{total}")
    after_source = source_metrics(table)
    if after_source != before:
        raise RuntimeError(f"Source {table} metrics changed during transfer")
    after_target = target_metrics(table)
    expected_target = processed if max_rows is not None else total
    if int(after_target["total"]) != expected_target:
        raise RuntimeError(
            f"Target {table} row count {after_target['total']} != {expected_target}"
        )
    if int(after_target["codes"]) != expected_target or int(after_target["orphans"]):
        raise RuntimeError(f"Target {table} uniqueness or parent check failed")
    if max_rows is None and int(after_target["roots"]) != int(before["roots"]):
        raise RuntimeError(f"Target {table} root count differs from source")
    print(f"{table}: VERIFIED rows={after_target['total']}, "
          f"codes={after_target['codes']}, roots={after_target['roots']}, "
          f"orphans={after_target['orphans']}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch-size", type=int, default=2000)
    parser.add_argument("--max-rows", type=int)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--table", choices=TABLES, action="append")
    arguments = parser.parse_args()
    if not 1 <= arguments.batch_size <= 5000:
        parser.error("batch size must be between 1 and 5000")
    if arguments.max_rows is not None and arguments.max_rows < 1:
        parser.error("max rows must be positive")
    for table in arguments.table or TABLES:
        transfer_table(table, arguments.batch_size, arguments.max_rows,
                       arguments.resume)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"TRANSFER STOPPED: {exc}", file=sys.stderr)
        raise SystemExit(1)
