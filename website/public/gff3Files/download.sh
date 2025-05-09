#!/bin/bash

# Path to your YAML file
yaml_file="files.yaml"

# Parse the YAML and download files
yq eval -o=json "$yaml_file" | jq -c '.[]' | while read -r item; do
  name=$(echo "$item" | jq -r '.name')
  url=$(echo "$item" | jq -r '.url')
  
  # Create directories if needed
  mkdir -p "$(dirname "$name")"
  
  echo "Downloading $url to $name..."
  curl -sSL "$url" -o "$name".gff3
done

echo "All files downloaded."
