#!/usr/bin/env bash
#
# Author: willfarrell (https://github.com/willfarrell)
# Source: https://raw.githubusercontent.com/willfarrell/docker-autoheal/2cb5d2bae90724764a8965b04b1cdd6d53ca5cfa/docker-entrypoint
# Description: This script is used to monitor the health of containers and restart them if they are unhealthy.
# License: MIT
#
# This script has been to be simplified for my use case, without the need of configuration via environment variables.

# shellcheck disable=2039
set -o pipefail

AUTOHEAL_CONTAINER_LABEL=${AUTOHEAL_CONTAINER_LABEL:-autoheal}
AUTOHEAL_START_PERIOD=${AUTOHEAL_START_PERIOD:-0}
AUTOHEAL_INTERVAL=${AUTOHEAL_INTERVAL:-5}
AUTOHEAL_DEFAULT_STOP_TIMEOUT=${AUTOHEAL_DEFAULT_STOP_TIMEOUT:-10}

docker_curl() {
	# shellcheck disable=2086
	curl --max-time 30 --no-buffer -s \
		--unix-socket /var/run/docker.sock \
		"$@"
}

# shellcheck disable=2039
get_container_info() {
	local label_filter
	local url

	# Set container selector
	if [[ ${AUTOHEAL_CONTAINER_LABEL} == "all" ]]; then
		label_filter=""
	else
		label_filter=",\"label\":\[\"${AUTOHEAL_CONTAINER_LABEL}=true\"\]"
	fi
	url="http://localhost/containers/json?filters=\{\"health\":\[\"unhealthy\"\]${label_filter}\}"
	docker_curl "${url}"
}

# shellcheck disable=2039
restart_container() {
	local container_id="$1"
	local timeout="$2"

	docker_curl -f -X POST "http://localhost/containers/${container_id}/restart?t=${timeout}"
}

# SIGTERM-handler
term_handler() {
	exit 143 # 128 + 15 -- SIGTERM
}

# shellcheck disable=2039
trap 'kill $$; term_handler' SIGTERM

if ! [[ -S "/var/run/docker.sock" ]]; then
	echo "unix socket is currently not available" >&2
	exit 1
fi
# Delayed startup
if [[ ${AUTOHEAL_START_PERIOD} -gt 0 ]]; then
	echo "Monitoring containers for unhealthy status in ${AUTOHEAL_START_PERIOD} second(s)"
	sleep "${AUTOHEAL_START_PERIOD}" &
	wait $!
fi

while true; do
	STOP_TIMEOUT=".Labels[\"autoheal.stop.timeout\"] // ${AUTOHEAL_DEFAULT_STOP_TIMEOUT}"
	get_container_info |
		jq -r ".[] | select(.Labels[\"autoheal\"] != \"False\") | foreach . as \$CONTAINER([];[]; \$CONTAINER | .Id, .Names[0], .State, ${STOP_TIMEOUT})" |
		while read -r CONTAINER_ID && read -r CONTAINER_NAME && read -r CONTAINER_STATE && read -r TIMEOUT; do
			# shellcheck disable=2039
			CONTAINER_SHORT_ID=${CONTAINER_ID:0:12}
			DATE=$(date +%d-%m-%Y" "%H:%M:%S)

			if [[ ${CONTAINER_NAME} == "null" ]]; then
				echo "${DATE} Container name of (${CONTAINER_SHORT_ID}) is null, which implies container does not exist - don't restart" >&2
			elif [[ ${CONTAINER_STATE} == "restarting" ]]; then
				echo "${DATE} Container ${CONTAINER_NAME} (${CONTAINER_SHORT_ID}) found to be restarting - don't restart"
			else
				echo "${DATE} Container ${CONTAINER_NAME} (${CONTAINER_SHORT_ID}) found to be unhealthy - Restarting container now with ${TIMEOUT}s timeout"
				if ! restart_container "${CONTAINER_ID}" "${TIMEOUT}"; then
					echo "${DATE} Restarting container ${CONTAINER_SHORT_ID} failed" >&2
				fi
			fi
		done
	sleep "${AUTOHEAL_INTERVAL}" &
	wait $!
done
