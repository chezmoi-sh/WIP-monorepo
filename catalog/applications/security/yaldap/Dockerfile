# Copyright (C) 2023 Alexandre Nicolaie (xunleii@users.noreply.github.com)
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
#
# trunk-ignore-all(hadolint/DL3006,checkov/CKV_DOCKER_7): ALPN_BASE contains IMAGE, TAG and SHA

# This argument is used to define which image should be used as base layer for
# the runtime image.
ARG ALPN_BASE


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <builder>: build the yaLDAP binary (Go)                                   │
# └───────────────────────────────────────────────────────────────────────────┘
FROM docker.io/library/golang:1.22.4-alpine3.19@sha256:c46c4609d3cc74a149347161fc277e11516f523fd8aa6347c9631527da0b7a56 AS builder

ARG YALDAP_VERSION

# trunk-ignore(hadolint/DL3018): don't care to pin dependencies on build
RUN set -eux; \
    apk add --no-cache git; \
    git clone --depth 1 --branch ${YALDAP_VERSION} https://github.com/xunleii/yaldap /src

WORKDIR /src

# build yaLDAP for ARM64 architecture
ENV CGO_ENABLED=0 \
    GOOS=linux GOARCH=arm64 GOARM=7

RUN set -eux; \
    go build \
        -ldflags " \
            -X github.com/prometheus/common/version.Version=${YALDAP_VERSION} \
            -X github.com/prometheus/common/version.Revision=$(git rev-parse --short HEAD) \
            -X github.com/prometheus/common/version.Branch=$(git rev-parse --abbrev-ref HEAD) \
            -X github.com/prometheus/common/version.BuildUser=$(whoami)@$(hostname) \
            -X github.com/prometheus/common/version.BuildDate=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
        " \
        -o /src/yaldap ./cmd/yaldap/


# ┌───────────────────────────────────────────────────────────────────────────┐
# │ <runtime>: create the yaLDAP runtime image using all previous stages      │
# └───────────────────────────────────────────────────────────────────────────┘
FROM ${ALPN_BASE} AS runtime

ARG YALDAP_VERSION

RUN set -eux; \
    addgroup --system --gid 64885 yaldap; \
    adduser --system --no-create-home --home /nonexistent --ingroup yaldap --uid 64885 yaldap;

COPY --from=builder /src/yaldap /src/LICENSE /opt/yaldap/

ENV PATH=/opt/yaldap:${PATH}

USER yaldap
WORKDIR /opt/yaldap
ENTRYPOINT ["yaldap", "run", "--backend.name", "yaml", "--backend.url", "file:///etc/yaldap/backend.yaml"]

EXPOSE 389
HEALTHCHECK --interval=5s CMD nc -z localhost 389 || exit 1

# metadata as defined by the Open Container Initiative (OCI) to keep traceability with
# the source code.
LABEL \
    org.opencontainers.image.authors="chezmoi.sh <xunleii@users.noreply.github.com>" \
    org.opencontainers.image.created="1970-01-01 00:00:00.000000000Z" \
    org.opencontainers.image.description="yaLDAP is an easy-to-use LDAP server using YAML file as directory definition." \
    org.opencontainers.image.documentation="https://github.com/chezmoi-sh/yaldap" \
    org.opencontainers.image.licenses="Apache-2.0" \
    org.opencontainers.image.revision="" \
    org.opencontainers.image.source="" \
    org.opencontainers.image.title="yaldap" \
    org.opencontainers.image.url="https://github.com/chezmoi-sh/nex.rpi" \
    org.opencontainers.image.version=${YALDAP_VERSION}
