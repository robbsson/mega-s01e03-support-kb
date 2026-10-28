<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // Counts as the desk counts them (CauseTable): one row per cause, by tenant. Reports the desk
  // read as a one-day move stay counted where they are filed and get a row of their own below.
  type Row = { url: string; outcome: string };
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, Row> } = $props();

  const all = reports as Report[];
  const merged = $derived(uniqueById(all).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const oneDay = $derived(groups.map((g) => ({ cause: g.cause, n: readAs(g, notes.oneDayMove) })).filter((x) => x.n));
  const issueNo = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ({all.length} rows in the export, {all.length - merged.length} of them repeats)
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th><th>now</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.cause)}
      {@const t = tickets[g.cause]}
      <tr class:loose={!t}>
        <td><code>{g.cause}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if t}<a href={t.url}>{issueNo(t.url)}</a>{:else}no ticket{/if}</td>
        <td>{t?.outcome ?? ''}</td>
      </tr>
    {/each}
    {#each oneDay as d (d.cause)}
      {@const t = tickets['one-day']}
      <tr class:loose={!t} class:open={t}>
        <td><code>one-day</code></td>
        <td>{d.n}</td>
        <td class="small" colspan="2">read as a one-day move, counted under <code>{d.cause}</code></td>
        <td>{#if t}<a href={t.url}>{issueNo(t.url)}</a>{:else}no ticket{/if}</td>
        <td>{t?.outcome ?? ''}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .loose td, .open td { background: var(--warn-bg); }
  .open td:last-child { color: var(--warn); font-weight: 600; }
</style>
