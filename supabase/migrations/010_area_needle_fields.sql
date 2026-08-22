-- Area and needle are free-text product specs (same spirit as the
-- existing size_mm field) — e.g. "full border" / "75/11". They are
-- display-only metadata collected in the admin Products form and shown
-- on DesignDetail; no validation beyond non-empty strings is required.

alter table designs
  add column if not exists area text;

alter table designs
  add column if not exists needle text;
