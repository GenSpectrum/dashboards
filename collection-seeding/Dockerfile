# Stage 1: use pixi to resolve and install dependencies
FROM ghcr.io/prefix-dev/pixi:0.58.0 AS builder
WORKDIR /app
COPY pixi.toml pixi.lock .
RUN pixi install --frozen

# Stage 2: slim runtime image — copy only the installed site-packages
FROM python:3.13-slim AS final
WORKDIR /app
COPY --from=builder /app/.pixi/envs/default/lib/python3.13/site-packages \
                    /usr/local/lib/python3.13/site-packages
COPY seed.py backend.py .
COPY sources/ sources/
CMD ["python", "seed.py"]
