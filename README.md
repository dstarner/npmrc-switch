# npmrc-switch

`npmrc-switch` is a CLI tool to save, load, and manage different npm configurations. 

## Why Does this Exist?

Primarily, because I wanted to learn the process of publishing `npm` packages and building JS executables.

Where I work, we have some pretty crazy proxy and VPN rules that make it difficult trying to get the right configuration for 
different package management systems. We have different networks and VPNs which have access to different external sources and 
internal proxies. Sometimes public registries are available, othertimes they are not. The goal of this project is to alleviate 
the pain of switching between different `npm` configurations for those environments.

## Basic Usage

Let's put the CLI through some paces to see what it does and how it performs.

### Building Our Configuration & Saving It

Let's say we have a registry that is super insecure, but we still want to connect with it. We don't want 
to always use the insecure registry, but its repeatable enough that we don't want to keep (un)commenting 
or (un)setting configuration values. This is a great place for `npmrc-switch`, because we can jump between 
configurations for the insecure registry and the standard `npm` registry.

Let's assume you are starting off with a fresh configuration. If you aren't then read through, and feel free 
to `save` and `clear` to get to this point.

Let's add some `npm` configurations and save it, as `test-config`.

```bash
# Turn off strict-ssl, as an example
$ npm config set strict-ssl false

# Save the configuration
$ npmrc-switch save test-config
```

### View Our Configuration(s)

Let's double check that our configuration is good and set. We can do this with the `view` command. `view` takes 
a name argument for the configuration to show. If passed `current`, it will give the current `.npmrc` file. If 
given `all`, then it will show all saved configurations.

```bash
$ npmrc-switch view test-config
```

### Clear our NPM Configuration 😱

*Oh no!* We are going to nuke our `.npmrc`?!? Yup. To prove a point. `npmrc-switch` has a command to do this.

```bash
$ npmrc-switch clear
```

### Load Back Our Configuration

Let's load back our saved configuration using the `load` command. It takes the name of the configuration to load.

```bash
$ npmrc-switch load test-config
```

### Delete Our Saved Configuration

Now that we are back to where we want to be, we can delete our configuration. This isn't recommended if we needed the 
configuration again, but hey, maybe this insecure registry finally got shut down, so we won't need it anymore. Let's 
use the `delete` command.

```bash
$ npmrc-switch delete test-config
```

## How to Install 

Follow either the global or `npx` install below. Its like choose your own adventure games, but much less exciting.

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