#!/bin/bash
DIR="/home/z/my-project/public/exercises"
cd "$DIR"
STYLE="Flat vector illustration of a person, fitness app style, clean white background, minimal, vibrant blue and orange colors, no text, no face details, sporty figure, high quality"

generate() {
  local id=$1 prompt=$2
  if [ -f "${id}.png" ]; then echo "SKIP $id"; return; fi
  echo "GEN $id..."
  for i in 1 2 3; do
    result=$(z-ai image -p "$prompt" -o "./${id}.png" -s 1024x1024 2>&1)
    if echo "$result" | grep -q "saved"; then
      echo "  OK $id"
      sleep 4
      return
    fi
    echo "  retry $i..."
    sleep 8
  done
  echo "  FAIL $id"
}

generate "lunge" "$STYLE, doing forward lunges with dumbbells, side view"
generate "shoulder_press" "$STYLE, doing dumbbell shoulder press standing, front view"
generate "deadlift" "$STYLE, doing barbell deadlift, side view"
generate "bridge" "$STYLE, doing glute bridge on floor, side view"
generate "jumping_jacks" "$STYLE, doing jumping jacks mid-air, front view"
generate "burpees" "$STYLE, doing burpee exercise mid-movement, side view"
generate "high_knees" "$STYLE, doing high knees running in place, side view"
generate "mountain_climbers" "$STYLE, doing mountain climber exercise on floor, side view"
generate "jump_rope" "$STYLE, jumping rope, side view"
generate "rowing_machine_ex" "$STYLE, using rowing machine, side view"
generate "treadmill_run" "$STYLE, running on treadmill, side view"
generate "exercise_bike_ex" "$STYLE, riding exercise bike, side view"
generate "stretch_hamstrings" "$STYLE, stretching hamstrings while sitting on floor, side view"
generate "cat_cow" "$STYLE, doing cat-cow yoga stretch on all fours, side view"

echo "=== DONE ==="
ls *.png | wc -l