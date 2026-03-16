{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  inputs.flake-parts.url = "github:hercules-ci/flake-parts";

  outputs = inputs: inputs.flake-parts.lib.mkFlake { inherit inputs; } {
    systems = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
    perSystem = { pkgs, system, ... }: {
      devShells.default = pkgs.mkShell {
        packages = with pkgs; [ nodejs electron ffmpeg ];
        shellHook = ''
          export ELECTRON_OVERRIDE_DIST_PATH="${pkgs.electron}/bin"
          export ELECTRON_SKIP_BINARY_DOWNLOAD=1
        '';
      };
    };
  };
}