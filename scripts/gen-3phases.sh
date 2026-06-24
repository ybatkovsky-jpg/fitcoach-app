#!/bin/bash
DIR="/home/z/my-project/public/exercises"
cd "$DIR"
STYLE="Flat vector illustration of a person, fitness app style, clean white background, minimal, vibrant blue and orange colors, no text, no face details, sporty figure, high quality"

gen() {
  local id=$1 suffix=$2 prompt=$2
  local out="${id}_${suffix}.png"
  if [ -f "$out" ]; then echo "SKIP $out"; return; fi
  echo "GEN $out..."
  for i in 1 2 3; do
    result=$(z-ai image -p "$prompt" -o "./$out" -s 1024x1024 2>&1)
    if echo "$result" | grep -q "saved"; then
      echo "  OK $out"
      sleep 5
      return
    fi
    echo "  retry $i..."
    sleep 10
  done
  echo "  FAIL $out"
}

# START positions (standing/ready pose)
gen squat "start" "$STYLE, standing upright with barbell on shoulders, ready position, front view"
gen push_up "start" "$STYLE, person in high plank position with straight arms, push-up starting position, side view"
gen row "start" "$STYLE, person standing bent forward holding dumbbells at arm's length, row starting position, side view"
gen plank "start" "$STYLE, person in forearm plank position, straight body line, starting hold, side view"
gen lunge "start" "$STYLE, person standing upright with dumbbells at sides, lunge ready position, side view"
gen shoulder_press "start" "$STYLE, person standing with dumbbells at shoulder height, press starting position, front view"
gen deadlift "start" "$STYLE, person standing over barbell with arms down, deadlift ready position, side view"
gen bridge "start" "$STYLE, person lying on back with knees bent feet flat on floor, bridge starting position, side view"
gen jumping_jacks "start" "$STYLE, person standing with arms at sides and feet together, jumping jacks starting position, front view"
gen burpees "start" "$STYLE, person standing upright with arms at sides, burpee starting position, side view"
gen high_knees "start" "$STYLE, person standing with slight bend ready to run in place, starting position, side view"
gen mountain_climbers "start" "$STYLE, person in high plank position with one knee forward, mountain climber start, side view"
gen jump_rope "start" "$STYLE, person standing holding rope handles at hips, ready to jump, side view"
gen rowing_machine_ex "start" "$STYLE, person sitting on rowing machine with arms extended, catch position, side view"
gen treadmill_run "start" "$STYLE, person standing on treadmill about to start running, ready position, side view"
gen exercise_bike_ex "start" "$STYLE, person sitting on exercise bike with hands on handlebars, ready position, side view"
gen stretch_hamstrings "start" "$STYLE, person sitting on floor with legs extended straight, about to stretch hamstrings, side view"
gen cat_cow "start" "$STYLE, person on all fours with flat back, neutral spine position, cat-cow starting pose, side view"

echo "=== START DONE ==="

# FINISH/end positions (completed rep pose)
gen squat "finish" "$STYLE, person at bottom of squat, thighs parallel to ground, barbell on shoulders, side view"
gen push_up "finish" "$STYLE, person at bottom of push-up, chest near floor, elbows bent, side view"
gen row "finish" "$STYLE, person pulling dumbbells up to waist, elbows back, row finish position, side view"
gen plank "finish" "$STYLE, person holding plank with slight hip dip showing effort, plank end position, side view"
gen lunge "finish" "$STYLE, person in deep lunge with back knee near floor, dumbbells at sides, side view"
gen shoulder_press "finish" "$STYLE, person pressing dumbbells fully overhead with arms extended, side view"
gen deadlift "finish" "$STYLE, person standing upright with barbell at hip level, deadlift locked out position, side view"
gen bridge "finish" "$STYLE, person at top of glute bridge, hips raised high, bridge peak position, side view"
gen jumping_jacks "finish" "$STYLE, person mid-air with arms raised overhead and legs spread wide, jumping jacks peak, front view"
gen burpees "finish" "$STYLE, person at bottom of burpee in push-up position on floor, side view"
gen high_knees "finish" "$STYLE, person running in place with one knee raised high to chest, side view"
gen mountain_climbers "finish" "$STYLE, person in plank with one knee driven forward to chest, mountain climber peak, side view"
gen jump_rope "finish" "$STYLE, person mid-air jumping over rope, rope at peak height below feet, side view"
gen rowing_machine_ex "finish" "$STYLE, person pulling rowing machine handle to chest, legs extended, finish position, side view"
gen treadmill_run "finish" "$STYLE, person running on treadmill with one foot lifted mid-stride, dynamic pose, side view"
gen exercise_bike_ex "finish" "$STYLE, person pedaling exercise bike with one leg extended downward, cycling mid-stroke, side view"
gen stretch_hamstrings "finish" "$STYLE, person stretching forward reaching toward toes, hamstring stretch peak position, side view"
gen cat_cow "finish" "$STYLE, person on all fours with back arched upward in cat pose, cat-cow cat position, side view"

echo "=== ALL DONE ==="
ls *_start.png *_finish.png 2>/dev/null | wc -l