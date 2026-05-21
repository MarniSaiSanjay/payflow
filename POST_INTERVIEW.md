# Post-interview action items — PayFlow Azure

> Local-only checklist. Not committed.

Once the interview is done, decide one of three paths:

| Goal | Action | Time | Resulting cost |
|---|---|---|---|
| Keep it live as a portfolio piece | Downsize the App Service (see §1) | 2 min | ~$12/mo (just Postgres) |
| Keep it live, cheapest possible | §1 **and** stop Postgres when idle (see §2) | 5 min | $0 when stopped, ~$12/mo when on |
| Tear it down completely | §3 — delete the whole resource group | 2 min | $0 |

---

## 1. Downsize App Service backend to free F1 tier

Drops App Service from B1 (~$13/mo) to F1 ($0). F1 has cold starts and a 60-min/day CPU cap, fine for a portfolio.

```bash
az appservice plan update \
  --name payflow-plan \
  --resource-group payflow-rg \
  --sku F1
```

Verify:

```bash
az appservice plan show \
  --name payflow-plan \
  --resource-group payflow-rg \
  --query "sku.{tier:tier, name:name}" -o table
```

If you ever need to scale back up for a demo: `--sku B1`.

---

## 2. Stop Postgres when not in use

Postgres B1ms is ~$12/mo running 24/7. You can stop it (no compute charges, you still pay tiny storage cost, ~$1.50/mo).

**Stop:**
```bash
az postgres flexible-server stop \
  --name payflow-db \
  --resource-group payflow-rg
```

**Start again** (takes ~1-2 min):
```bash
az postgres flexible-server start \
  --name payflow-db \
  --resource-group payflow-rg
```

Note: Azure auto-starts a stopped server after 7 days. To stay stopped longer, run `stop` again.

---

## 3. Nuke everything

Single command deletes Postgres, App Service, Static Web App, Key Vault, and the resource group itself. Irreversible — back up the DB first if you care about the data.

```bash
# Optional: dump the DB first (if you want the data archived)
PGPASSWORD='c98HWBuVv87wz5GIivIz' pg_dump \
  -h payflow-db.postgres.database.azure.com \
  -U payflowadmin \
  -d payflow_db \
  --no-owner --no-acl \
  > ~/payflow-final-dump.sql

# Delete everything
az group delete \
  --name payflow-rg \
  --yes \
  --no-wait
```

Then on GitHub:
- Delete the two secrets `AZUREAPPSERVICE_PUBLISHPROFILE` and `AZURE_STATIC_WEB_APPS_API_TOKEN`
  ```bash
  gh secret delete AZUREAPPSERVICE_PUBLISHPROFILE --repo MarniSaiSanjay/payflow
  gh secret delete AZURE_STATIC_WEB_APPS_API_TOKEN --repo MarniSaiSanjay/payflow
  ```
- Optionally delete `.github/workflows/deploy-backend.yml` and `.github/workflows/deploy-frontend.yml`
- Optionally remove the "Live demo" + "Deployment" sections from README.md
- Locally: `rm -rf /Users/marnisaisanjay/.payflow-azure/`

---

## 4. Cost monitoring (if keeping it running)

Set a budget alert so you get an email if monthly spend exceeds a threshold:

```bash
az consumption budget create \
  --budget-name payflow-monthly-cap \
  --amount 30 \
  --resource-group payflow-rg \
  --time-grain Monthly \
  --start-date $(date -u +%Y-%m-01) \
  --end-date $(date -u -v+12m +%Y-%m-01) \
  --category cost \
  --notifications '{"actual_80":{"enabled":true,"operator":"GreaterThan","threshold":80,"contactEmails":["marnisaisanjay1@outlook.com"]}}'
```

This pings you when actual spend hits $24/month (80% of $30 cap).

---

## 5. Things to clean up no matter which path

- [ ] Revoke the Postgres admin password in Key Vault if you wrote it anywhere insecure
- [ ] Check `gh secret list --repo MarniSaiSanjay/payflow` — only keep what you need
- [ ] If you tore down, drop the deploy workflows from `.github/workflows/` — they'll fail on every push otherwise

---

## Reference: live URLs (only valid while resources exist)

- Frontend: https://purple-pond-0d0b80200.7.azurestaticapps.net
- Backend: https://payflow-api.azurewebsites.net
- DB host: payflow-db.postgres.database.azure.com
- Key Vault: https://payflow-kv.vault.azure.net
- Local credentials backup: `/Users/marnisaisanjay/.payflow-azure/credentials.env`
