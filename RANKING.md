
# Ranking



stat_module.xml

## notes


```bash
[
    'virtual_server_stat',      // general vs stats
    'virtual_server_cpu_stat',  // vs cpu stats
    'gtm_wideip_stat',          // gtm wideip stats
    'profile_clientssl_stat',
    'plane_cpu_stat',
    'rule_stat',
    'asm_cpu_util_stats',
    'asm_learning_suggestions_stats',
    'asm_enforced_entities_stats',
]
```

## Ranking system

Top N = 10
key = virtual server name

```yaml
virtual_server_stat:  
  - clientside.pkts_in
  - clientside.bytes_in
  - clientside.pkts_out
  - clientside.bytes_out
  - clientside.max_conns
  - clientside.tot_conns
  - clientside.cur_conns
```

Step 1: Sort/Collect top 10 VS from each of the seven stats above
    - Each VS will be scored; 10 for #1, 9 for #2, and 1 for #10 (last)
        - Every item in each top list gets a score just for getting on the list
Step 2: Collect Scores
    - Create new table adding up the scores to produce a rank
    - third column providing reasons for rank
        - [[clientside.pkts_in, 6], [clientside.bytes_in, 5], [clientside.max_conns, 1], [clientside.tot_conns, 2]]

### virtual_server_stat

```json
{
    columns: [
        {id: 'name', name: 'Name'},
        {id: 'clientside.pkts_in', name: 'Packets In'},
        {id: 'clientside.bytes_in', name: 'Bytes In'},
        {id: 'clientside.pkts_out', name: 'Packets Out'},
        {id: 'clientside.bytes_out', name: 'Bytes Out'},
        {id: 'clientside.max_conns', name: 'Max Connections'},
        {id: 'clientside.tot_conns', name: 'Total Connections'},
        {id: 'clientside.cur_conns', name: 'Current Connections'},
    ],
    search: true,
    sort: true,
    data: Object.values(data.virtual_server_stat)
  }
```


### virtual_server_cpu_stat

```json
{
    columns: [
        {id: 'name', name: 'Name'},
        {id: 'avg_5sec', name: 'Average - 5 sec'},
        {id: 'avg_1min', name: 'Average - 1 min'},
        {id: 'avg_5min', name: 'Average - 5 min'}
    ],
    search: true,
    sort: true,
    data: Object.values(data.virtual_server_cpu_stat)
  }
```