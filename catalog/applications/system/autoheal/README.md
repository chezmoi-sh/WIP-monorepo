<!-- markdownlint-disable MD033 -->
<h1 align="center">
  System · autoheal
  <br/>
</h1>

<h3 align="center">autoheal - Monitor and restart unhealthy docker containers</h3>

<div align="center">

[![Version](https://img.shields.io/badge/Version-v1.0.0-orange.svg)]()
[![Category](https://img.shields.io/badge/Category-System-purple.svg)](../)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../../../../LICENSE)
<br>
<br>
[![Unofficial distribution](https://img.shields.io/badge/Unofficial_Distribution-coral.svg?logo=gitlfs&logoColor=white)]()
[![Official documentation](https://img.shields.io/badge/Official_documentation-333.svg?logo=github)](https://github.com/willfarrell/docker-autoheal)

<a href="#about">About</a> ·
<a href="#getting-started">Getting Started</a> ·
<a href="#security-concerns">Security concerns</a> ·
<a href="#license">License</a>

</div>

---

<!-- markdownlint-enable MD033 -->

## About

autoheal is a Docker container that monitors and restarts unhealthy containers. It relies on the Docker API to monitor
the health of containers with the `HEALTHCHECK` instruction. Unfortunatly, this instruction didn't impact the container
status, so autoheal was created to fill this gap.

## Getting Started

This project wraps the autoheal application in a Docker container, making it easy to deploy and run with Pulumi.
In order to keep consistency over all other applications and to follow some best practices, this project builds its
own Docker image.

> [!NOTE]
> This "Pulumi application" was created with a specific vision in mind, so customization is not a strength of this
> project and only certain options (mainly runtime-related) are accessible.

### How to use this application

#### - as Docker container

> [!WARNING]
> This container relies on the Docker API to monitor the health of other containers. This means that it needs to be
> used with the root user and with access to the Docker socket. This is a security risk, so use it with caution.

```typescript
import { asset } as pulumi from "@pulumi/pulumi";
import { AutoHeal, Version } from "@catalog.chezmoi.sh/system~autoheal";
import { AlpineImage, Version as AlpineVersion } from "@catalog.chezmoi.sh/os~alpine-3.19";

const alpine = new AlpineImage("alpine", { push: true, tags: [`my.oci.registry/alpine:${AlpineVersion}`] });
const autoheal = new AutoHeal("autoheal", {
    imageArgs: { from: alpine, push: true, tags: [`my.oci.registry/autoheal:${Version}`] },
    containerArgs: {
        wait: true,
    }
});
```

## Security concerns

One of my visions is to provide a secure environment for all applications that I run at home. This is why all images are
built locally, why all dependencies, when it make sense, are pinned, and why all images are scanned for vulnerabilities
before running them (see [my Pulumi policy packs](../../../../lib/policy-pack/)).
However, even with all these precautions, I'm not a security expert, so I can't guarantee that this project is 100%
secure.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](../../../../LICENSE) file for details.

> [!NOTE]
> This project is not affiliated with the autoheal project, which can be viewed on
> [Github](https://github.com/willfarrell/docker-autoheal).
> However, if you are a maintainer of the autoheal project and would like to authorize the distribution of
> autoheal through this project, you are welcome to do so by creating a Pull Request.
