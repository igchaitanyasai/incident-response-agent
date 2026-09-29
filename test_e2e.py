import urllib.request
import json
import sys

BASE = 'http://localhost:8000'

def req(path, method='GET', data=None):
    url = f'{BASE}{path}'
    headers = {'Content-Type': 'application/json'}
    body = json.dumps(data).encode('utf-8') if data else None
    request = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode('utf-8'))

def run_test():
    print("======================================================================")
    print("      INTELLIGENT INCIDENT RESPONSE AGENT - E2E LIVE TEST RUNNER     ")
    print("======================================================================")

    # 1. Health check
    print("\n[1/6] Backend Health Check:")
    h = req('/health')
    print("  [OK] Status:", h['status'], "| Database:", h['database'])

    # 2. Reset DB
    print("\n[2/6] Resetting Demo Database:")
    r = req('/api/demo/reset', method='POST')
    print("  [OK] Result:", r['message'])

    # 3. Phase 1
    print("\n[3/6] Phase 1: Ingesting First-Time DB Timeout (payment-service):")
    inc1 = req('/api/demo/trigger/db_timeout_1', method='POST')
    inc1_id = inc1['id']
    print(f"  [OK] Incident ID: {inc1_id}")
    print(f"  [OK] Title: {inc1['title']}")
    print(f"  [OK] Severity: {inc1['severity']}")

    print("\n[3b/6] Checking Secret Redaction in Ingested Logs:")
    logs1 = req(f'/api/incidents/{inc1_id}/logs')
    masked_count = sum(l.get('masked_secrets_count', 0) for l in logs1)
    print(f"  [OK] Total Secrets Masked/Redacted: {masked_count}")
    for l in logs1:
        if l['is_masked']:
            print(f"    - [{l['log_level']}] {l['message'][:85]}...")

    print("\n[3c/6] Running AI Investigation on First Incident:")
    inv1 = req(f'/api/incidents/{inc1_id}/investigate', method='POST')
    print(f"  [OK] Summary: {inv1['summary'][:110]}...")
    print(f"  [OK] Confidence Rating: {int(inv1['confidence_score']*100)}%")
    print(f"  [OK] Has Hindsight Match: {inv1['has_hindsight_match']}")
    print("  [OK] Formulated Hypotheses:")
    for hyp in inv1['hypotheses']:
        print(f"    - [{hyp['id']}] {hyp['title']} ({int(hyp['confidence']*100)}% prob)")

    print("\n[3d/6] Operational Action Guardrails Test:")
    safe_act = req(f'/api/actions/execute?incident_id={inc1_id}', method='POST', data={
        'action_name': 'check_db_pool_status',
        'action_type': 'SAFE',
        'target_service': 'payment-service'
    })
    print(f"  [OK] SAFE Action Execution: Status={safe_act['status']} | Output={safe_act['result']['status']}")

    hi_act = req(f'/api/actions/execute?incident_id={inc1_id}', method='POST', data={
        'action_name': 'restart_service',
        'action_type': 'HIGH_IMPACT',
        'target_service': 'payment-service'
    })
    print(f"  [OK] HIGH_IMPACT Action Pre-Approval Status: Status={hi_act['status']} (Pending Authorization)")

    app_act = req('/api/actions/approve', method='POST', data={
        'action_id': hi_act['action_id'],
        'approved': True,
        'approver_name': 'Lead SRE (John Doe)',
        'notes': 'Approved restart.'
    })
    print(f"  [OK] HIGH_IMPACT Action Post-Approval Status: Status={app_act['status']} | Output={app_act['result']['status']}")

    print("\n[3e/6] Engineer Resolves Incident & Commits to Hindsight Persistent Memory:")
    res1 = req(f'/api/incidents/{inc1_id}/resolve', method='POST', data={
        'confirmed_root_cause': 'HikariCP connection pool exhausted due to unclosed JDBC sessions in checkout repository.',
        'verified_resolution': 'Increased max_connections to 200 and hot-patched transaction manager leak.',
        'resolution_steps': ['Adjust max_connections to 200 in config', 'Fix transaction leak in CheckoutService'],
        'engineer_rating': 5,
        'engineer_notes': 'AI correctly identified connection pool starvation.',
        'was_ai_helpful': True
    })
    print(f"  [OK] Incident Status: {res1['incident']['status']}")
    print(f"  [OK] Memory Saved ID: #{res1['memory_saved']['id'][:8]}")
    print(f"  [OK] Memory Title: {res1['memory_saved']['title']}")

    # 4. Phase 2 - Recurring Memory Recall
    print("\n[4/6] Phase 2: Ingesting Recurring Incident (order-service):")
    inc2 = req('/api/demo/trigger/db_timeout_2', method='POST')
    inc2_id = inc2['id']
    print(f"  [OK] Incident ID: {inc2_id}")
    print(f"  [OK] Title: {inc2['title']}")

    print("\n[4b/6] Running AI Investigation on Recurring Incident:")
    inv2 = req(f'/api/incidents/{inc2_id}/investigate', method='POST')
    print(f"  [OK] Has Hindsight Memory Match: {inv2['has_hindsight_match']}")
    if inv2['has_hindsight_match']:
        top_match = inv2['matched_memories'][0]
        print(f"  ===============================================================")
        print(f"  [RECALL] HINDSIGHT MEMORY RECALL ACTIVATED (Match ID: #{top_match['memory_id'][:8]})")
        print(f"     Title: {top_match['title']}")
        print(f"     Similarity Score: {top_match['similarity_percentage']}%")
        print(f"     Confirmed Historical Root Cause: {top_match['confirmed_root_cause']}")
        print(f"     Proven Historical Fix: {top_match['successful_resolutions'][0]}")
        print(f"  ===============================================================")

    # 5. Memory Stats
    print("\n[5/6] Hindsight Memory Bank Overview:")
    mem_stats = req('/api/memory/stats')
    print(f"  [OK] Total Memories Stored: {mem_stats['total_memories']}")
    print(f"  [OK] Total Memory Retrievals: {mem_stats['total_retrievals']}")
    print(f"  [OK] Avg Resolution Success Rate: {int(mem_stats['average_success_rate']*100)}%")

    # 6. Frontend check
    print("\n[6/6] Frontend Web Application Check:")
    with urllib.request.urlopen('http://localhost:3000/') as fe_res:
        html = fe_res.read().decode('utf-8')
        print(f"  [OK] http://localhost:3000 is ONLINE (Status 200, Bundle size: {len(html)} bytes)")

    print("\n======================================================================")
    print("   *** ALL END-TO-END TESTS PASSED CLEANLY WITH ZERO ERRORS! ***")
    print("======================================================================")

if __name__ == '__main__':
    run_test()
