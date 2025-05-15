#!/bin/bash

yaml_file="files.yaml"
target_dir="../../public/gff3Files"

yq eval -o=json "$yaml_file" | jq -c '.[]' | while read -r item; do
  name=$(echo "$item" | jq -r '.name')
  url=$(echo "$item" | jq -r '.url')

  target_path="$target_dir/$name"

  mkdir -p "$(dirname "$target_path")"
  
  echo "Downloading $url to $target_path.gff3..."
  curl -sSL "$url" -o "$target_path.gff3"
done

echo "All files downloaded into $target_dir."