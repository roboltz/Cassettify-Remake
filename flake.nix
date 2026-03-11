{
  description = "Cassettify Package";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: 
  let 
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in 
  {
    devShells.${system}.default = pkgs.mkShell {
      packages = with pkgs; [ nodejs electron ];
      shellHook = ''
        export ELECTRON_OVERRIDE_DIST_PATH="${pkgs.electron}/bin"
        export ELECTRON_SKIP_BINARY_DOWNLOAD=1
      '';
    };
  };
}