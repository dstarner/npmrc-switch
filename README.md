# npmrc-switch

`npmrc-switch` is a CLI tool to save, load, and manage different npm configurations. 

## Why Does this Exist?

Where I work, we have some pretty crazy proxy and VPN rules that make it difficult trying to get the right configuration for 
different package management systems. We have different networks and VPNs which have access to different external sources and 
internal proxies. Sometimes public registries are available, othertimes they are not. The goal of this project is to alleviate 
the pain of switching between different `npm` configurations for those environments.

## How to Use 

Its like choose your own adventure games, but much less exciting.

### Installing Globally

```bash
$ npm install -g npmrc-switch
# Or with sudo if needed
$ npm install -g npmrc-switch

# Run the command
$ npmrc-switch --help
```

### Using NPX

```bash
# Just remove the help and add your commands
$ npx npmrc-switch --help
```

### Alias for Easier Use

Consider adding this to your `.bashrc`, `.zshrc`, or `.profile` to make it easier to run.

```
# If installed
alias ns="npmrc-switch"
# If using npx
alias ns="npx npmrc-switch"
```