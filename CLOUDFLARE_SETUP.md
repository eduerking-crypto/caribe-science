# Cloudflare Setup Guide — CARIBE SCIENCE

## Arquitectura Final

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Usuario       │────▶│   Cloudflare     │────▶│  Cloudflare     │
│   (caribesci    │     │   DNS + Proxy    │     │  Pages          │
│    ence.com)    │     │   (WAF, DDoS,    │     │  (Frontend)     │
└─────────────────┘     │    SSL, Cache)   │     └─────────────────┘
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌───────────────┐         ┌───────────────┐
            │ Cloudflare    │         │  Render       │
            │ Tunnel        │────────▶│  Backend API  │
            │ (api.caribes  │         │  (Privado,    │
            │  cience.com)  │         │   sin IP      │
            └───────────────┘         │   pública)    │
                                      └───────┬───────┘
                                              ▼
                                      ┌───────────────┐
                                      │  PostgreSQL   │
                                      │  (Render)     │
                                      └───────────────┘
```

---

## 1. Cloudflare Pages (Frontend)

### En Cloudflare Dashboard:
1. **Pages** → **Create a project** → **Connect to Git**
2. Repo: `eduerking-crypto/caribe-science`
3. Config:
   - **Project name**: `caribe-frontend`
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `apps/web/.next/standalone`
   - **Root directory**: `apps/web`
   - **Node version**: `20`

### Environment Variables (Pages → Settings → Environment variables):
```
NEXT_PUBLIC_API_URL = https://api.caribescience.com
```

### Custom Domains (Pages → Custom domains):
- `caribescience.com`
- `www.caribescience.com`

---

## 2. Render (Backend + DB)

### En Render Dashboard:
1. **New** → **Blueprint**
2. Repo: `https://github.com/eduerking-crypto/caribe-science`
3. Render creará:
   - `caribe-db` (PostgreSQL free)
   - `caribe-backend` (Web Service free)

### Backend URL interna (para Tunnel):
`https://caribe-backend.onrender.com`

---

## 3. Cloudflare Tunnel (Zero Trust)

### Crear Tunnel:
1. **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel**
2. Name: `caribe-science`
3. **Cloudflared** (Docker/Standalone)
4. Copia el **Tunnel ID** y **Token**

### Configurar Public Hostnames:
| Subdomain | Domain | Service | URL |
|-----------|--------|---------|-----|
| `api` | `caribescience.com` | HTTP | `http://caribe-backend.onrender.com` |

### Ejecutar Tunnel (en Render o servidor propio):
```bash
# Docker (recomendado en Render como Background Worker)
docker run cloudflare/cloudflared:latest tunnel \
  --no-autoupdate run \
  --token <TUNNEL_TOKEN>
```

**O en Render: agregar Background Worker**
```yaml
# En render.yaml agregar:
  - type: worker
    name: cloudflare-tunnel
    runtime: docker
    dockerfilePath: ./cloudflared.Dockerfile
    envVars:
      - key: TUNNEL_TOKEN
        sync: false
```

### cloudflared.Dockerfile:
```dockerfile
FROM cloudflare/cloudflared:latest
ENTRYPOINT ["cloudflared", "tunnel", "--no-autoupdate", "run", "--token", "${TUNNEL_TOKEN}"]
```

---

## 4. DNS Records (Cloudflare DNS)

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `api` | `caribe-science.cfargotunnel.com` | ✅ Proxied |
| CNAME | `@` | `caribe-frontend.pages.dev` | ✅ Proxied |
| CNAME | `www` | `caribe-frontend.pages.dev` | ✅ Proxied |

**Importante**: Proxy = **ON** (nube naranja) para WAF/DDoS/SSL

---

## 5. Cloudflare WAF Rules (Gratis)

### Security → WAF → Custom rules:

**Rule 1: Bloquear SQLi/XSS básicos**
```
Field: URI Query String
Operator: contains
Value: union select|drop table|<script>|alert(
Action: Block
```

**Rule 2: Rate limiting API**
```
Field: Hostname
Operator: equals
Value: api.caribescience.com
Rate: 100 requests / 1 minute
Action: Challenge (CAPTCHA)
```

**Rule 3: Bloquear bots malos**
```
Field: User Agent
Operator: contains
Value: sqlmap|nikto|nmap|masscan|zgrab
Action: Block
```

**Rule 4: Solo HTTPS**
```
Always Use HTTPS: ON
Automatic HTTPS Rewrites: ON
Minimum TLS Version: 1.2
```

---

## 6. SSL/TLS Settings

### SSL/TLS → Overview:
- **Encryption mode**: Full (strict)
- **Always Use HTTPS**: ON
- **Automatic HTTPS Rewrites**: ON

### SSL/TLS → Edge Certificates:
- **TLS 1.3**: ON
- **HTTP/3 (with QUIC)**: ON
- **Opportunistic Encryption**: ON
- **TLS 1.2**: ON

---

## 7. Cache Rules (Performance)

### Caching → Configuration → Cache Rules:
```
Rule: Cache static assets
Expression: (http.request.uri.path matches "^/.*\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$")
Cache Eligibility: Eligible
Edge TTL: 1 year
Browser TTL: 1 month
```

---

## 8. Verificar Deployment

### Checklist:
- [ ] Frontend: `https://caribescience.com` carga
- [ ] Frontend: `https://www.caribescience.com` redirige
- [ ] API: `https://api.caribescience.com/api/v1/health` → `{"status":"ok"}`
- [ ] SSL: Candado verde en ambos dominios
- [ ] WAF: Probar `https://api.caribescience.com/api/v1/health?test=<script>` → bloqueado
- [ ] Headers: `curl -I https://caribescience.com` → security headers presentes

---

## 9. Costos (Todos Gratis)

| Servicio | Plan | Límite |
|----------|------|--------|
| Cloudflare Pages | Free | Unlimited sites, builds, bandwidth |
| Cloudflare DNS/Proxy | Free | Unlimited |
| Cloudflare WAF | Free | 5 custom rules |
| Cloudflare Tunnel | Free | Unlimited |
| Render Backend | Free | 750 hrs/mes |
| Render PostgreSQL | Free | 90 días (recreable) |

**Total: $0/mes**

---

## 10. Próximos Pasos (Opcional)

1. **Database persistente**: Migrar a Neon/Supabase (PostgreSQL gratis sin expiración)
2. **Monitoring**: Cloudflare Analytics + Render metrics
3. **Logs**: Cloudflare Logpush → R2/S3
4. **CI/CD**: GitHub Actions ya configurado para deploy automático