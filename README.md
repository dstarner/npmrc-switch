# npmrc-switch

`npmrc-switch` is a CLI tool to save, load, and manage different npm configurations. 

## Why Does this Exist?

Where I work, we have some pretty crazy proxy and VPN rules that make it difficult trying to get the right configuration for 
different package management systems. We have different networks and VPNs which have access to different external sources and 
internal proxies. Sometimes public registries are available, othertimes they are not. The goal of this project is to alleviate 
the pain of switching between different `npm` configurations for those environments.

## How to Use 