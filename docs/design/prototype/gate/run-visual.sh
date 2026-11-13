#!/bin/bash
# Capa visual: 3 corridas independientes por lote, con un modelo de Cursor (composer-2.5).
cd "$(dirname "$0")/.."
ids=$(node -e 'const r=require("./gate/report.json");console.log(Object.keys(r.viewports["412x915"]).join(" "))')
arr=($ids); n=${#arr[@]}; size=14
mkdir -p gate/visual
for run in 1 2 3; do
  for ((i=0; i<n; i+=size)); do
    batch="${arr[@]:i:size}"; b=$((i/size+1))
    out="gate/visual/run${run}-batch${b}.json"
    prompt=$(sed -e "s|OUTPUT_PATH|$out|" -e "s|SCREEN_IDS|${batch// /, }|" gate/vision-prompt.md)
    cursor-agent -p --force --model composer-2.5 --output-format text "$prompt" > "gate/visual/run${run}-batch${b}.log" 2>&1 &
  done
done
wait
ls gate/visual/*.json | wc -l
