# Copyright (C) 2024 Alexandre Nicolaie (xunleii@users.noreply.github.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ----------------------------------------------------------------------------


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <builder>: build the homepage project (NodeJS)                            │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/node:20.15.0-alpine3.19@sha256:1bdec9c67503d33348be6e73a8e5e94aad679b32da15e4fd3956e5e48f87f623 AS builder

ARG HOMEPAGE_VERSION

# trunk-ignore(hadolint/DL3018): don't care to pin dependencies on build
RUN set -eux; \
    apk add --no-cache git; \
    git clone --depth 1 --branch ${HOMEPAGE_VERSION} https://github.com/gethomepage/homepage /src; \
    mkdir --parent /src/config; \
    cp /src/src/skeleton/* /src/config/;

WORKDIR /src

# install all homepage dependencies
# trunk-ignore(hadolint/DL3016): don't care to pin npm dependencies on build
RUN set -eux; \
    npm install --global pnpm; \
    pnpm fetch && pnpm install --recursive --offline;

# use dummy values for buildtime cache
# NOTE: this is required to avoid some "default" values being used in the homepage
#       when the client cache is empty/missing.
RUN set -eux; \
    echo "---" > /src/config/bookmarks.yaml; \
    echo "---" > /src/config/docker.yaml; \
    echo "---" > /src/config/kubernetes.yaml; \
    echo "---" > /src/config/services.yaml; \
    echo "---" > /src/config/settings.yaml; \
    echo "---" > /src/config/widgets.yaml;

# build homepage with telemetry disabled
RUN set -eux; \
    pnpm exec next telemetry disable && \
        NEXT_PUBLIC_BUILDTIME=$(date -Iseconds) \
        NEXT_PUBLIC_VERSION=${HOMEPAGE_VERSION} \
        NEXT_PUBLIC_REVISION=$(git rev-parse HEAD) \
        pnpm run build;


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <runtime>: create the homepage runtime image using all previous stages    │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/node:20.15.0-alpine3.19@sha256:1bdec9c67503d33348be6e73a8e5e94aad679b32da15e4fd3956e5e48f87f623 AS runtime

ARG HOMEPAGE_VERSION

RUN set -eux; \
    addgroup --system --gid 64752 homepage; \
    adduser --system --no-create-home --home /nonexistent --ingroup homepage --uid 64752 homepage; \
    mkdir -p /app; \
    chown -R homepage:homepage /app;

COPY --from=builder --chown=homepage:homepage /src/.next/standalone /app
COPY --from=builder --chown=homepage:homepage /src/.next/static/ /app/.next/static/
COPY --from=builder --chown=homepage:homepage /src/config/ /app/config/
COPY --from=builder --chown=homepage:homepage /src/next.config.js /app/next.config.js
COPY --from=builder --chown=homepage:homepage /src/public /app/public/

USER homepage
WORKDIR /app
ENTRYPOINT ["node", "server.js"]

EXPOSE 3000
HEALTHCHECK --interval=10s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthcheck || exit 1

# metadata as defined by the Open Container Initiative (OCI) to keep traceability with
# the source of the container image.
LABEL \
    org.opencontainers.image.authors="chezmoi.sh <xunleii@users.noreply.github.com>" \
    org.opencontainers.image.created="01/01/1970T00:00:00.000" \
    org.opencontainers.image.description="A highly customizable homepage (or startpage / application dashboard) with Docker and service API integrations." \
    org.opencontainers.image.documentation="https://gethomepage.dev/${HOMEPAGE_VERSION}/latest/" \
    org.opencontainers.image.licenses="Apache-2.0" \
    org.opencontainers.image.revision="" \
    org.opencontainers.image.source="" \
    org.opencontainers.image.title="homepage" \
    org.opencontainers.image.url="https://github.com/chezmoi-sh/nex.rpi" \
    org.opencontainers.image.version=${HOMEPAGE_VERSION}
