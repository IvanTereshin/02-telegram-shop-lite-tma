# Deployment

## Production container

This app ships as a static Vite build served by nginx.

```bash
docker build -t tma-02-shop:production .
docker run --rm -p 8080:80 tma-02-shop:production
```

## Dev-server deployment

Current compose path on the demo server:

```text
/Users/ivantereshin/Documents/SERVER/demos/tma-02-shop/docker-compose.yml
```

Target public URL:

```text
https://tma-02-shop.ivantereshin-test.store
```

Health probe: `GET /healthz` возвращает `200 ok`.

The container is a production-built portfolio demo behind Traefik. Product state and
payment are still local simulations; see `PRODUCTION_CHECKLIST.md` before real launch.
