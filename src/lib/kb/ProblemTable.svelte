<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { splitTicket, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  // tickets: where each problem is tracked now, problem → issue url.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const all = reports as Report[];
  const merged = $derived(uniqueById(all).filter((r) => r.mergedInto === ticket).length);
  const groups = $derived(splitTicket(all, ticket, tenantOf, notes.oneDayMove));
  const counted = $derived(groups.reduce((n, g) => n + g.reports.length, 0));
  const issueNo = (url: string) => '#' + url.split('/').pop();
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged}</strong> reports merged into #{ticket} ({all.length} rows in the export, {all.length - merged} of them repeats) ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>way in</th><th>intake tag differs</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr class:loose={!tickets[g.problem]}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants.length}</td>
        <td class="small">{channels(g.channels)}</td>
        <td>{g.mistagged}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]}>{issueNo(tickets[g.problem]!)}</a>{:else}no ticket{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if counted !== merged}
  <p class="check">The problems cover {counted} of {merged} reports. Something is counted twice or not at all.</p>
{/if}

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .loose td { background: var(--warn-bg); }
  .check { color: var(--warn); font-weight: 600; }
</style>
