#!/usr/bin/env sh
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

# Copy the default configuration file to /tmp because the /etc/adguardhome
# directory is mounted as read-only and AdGuard Home can't write to it.
cp /etc/adguardhome/AdGuardHome.yaml /var/lib/adguardhome/transient-config/AdGuardHome.yaml

# Start AdGuard Home
exec /opt/adguardhome/bin/AdGuardHome \
	--no-check-update \
	--config /var/lib/adguardhome/transient-config/AdGuardHome.yaml \
	--work-dir /var/lib/adguardhome
