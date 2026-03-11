{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  inputs.flake-parts.url = "github:hercules-ci/flake-parts";

  outputs = inputs: inputs.flake-parts.lib.mkFlake { inherit inputs; } {
    # Other systems than the ones listed below are untested.
    # If you have another system type you can add it here to test with nix develop.
    systems = [
      "x86_64-linux"
    ];
    perSystem = { pkgs, system, ... }: {
      devShells.default = pkgs.mkShell {
        packages = with pkgs; [ nodejs electron ];
        shellHook = ''
          export ELECTRON_OVERRIDE_DIST_PATH="${pkgs.electron}/bin"
          export ELECTRON_SKIP_BINARY_DOWNLOAD=1
        '';
      };
    };
  };
}