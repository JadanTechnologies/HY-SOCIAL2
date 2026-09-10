#!/bin/bash
set -e

mkdir -p public/videos

echo "Generating 1. dance_flow.mp4..."
ffmpeg -y -f lavfi -i "color=c=0x4338ca:s=180x320:d=14,hue=H=2*PI*t/14:s=1.2,scale=720:1280:flags=bilinear" \
  -f lavfi -i "anoisesrc=d=14:c=pink:r=44100:a=0.03,lowpass=f=450,volume=1.8" \
  -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -preset ultrafast -movflags +faststart \
  -c:a aac -b:a 128k public/videos/dance_flow.mp4

echo "Generating 2. cyberpunk_tokyo.mp4..."
ffmpeg -y -f lavfi -i "color=c=0x06b6d4:s=180x320:d=14,hue=H=2*PI*t/7:s=1.4,scale=720:1280:flags=bilinear" \
  -f lavfi -i "sine=f=220:d=14,volume=0.05" \
  -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -preset ultrafast -movflags +faststart \
  -c:a aac -b:a 128k public/videos/cyberpunk_tokyo.mp4

echo "Generating 3. venice_skate.mp4..."
ffmpeg -y -f lavfi -i "color=c=0xf97316:s=180x320:d=14,hue=H=2*PI*t/10:s=1.3,scale=720:1280:flags=bilinear" \
  -f lavfi -i "anoisesrc=d=14:c=brown:r=44100:a=0.04,lowpass=f=550,volume=1.5" \
  -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -preset ultrafast -movflags +faststart \
  -c:a aac -b:a 128k public/videos/venice_skate.mp4

echo "Generating 4. tape_synth.mp4..."
ffmpeg -y -f lavfi -i "color=c=0x10b981:s=180x320:d=14,hue=H=2*PI*t/12:s=1.2,scale=720:1280:flags=bilinear" \
  -f lavfi -i "sine=f=164.81:d=14,volume=0.05" \
  -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -preset ultrafast -movflags +faststart \
  -c:a aac -b:a 128k public/videos/tape_synth.mp4

echo "Generating 5. coastal_waves.mp4..."
ffmpeg -y -f lavfi -i "color=c=0x0284c7:s=180x320:d=14,hue=H=2*PI*t/8:s=1.1,scale=720:1280:flags=bilinear" \
  -f lavfi -i "anoisesrc=d=14:c=pink:r=44100:a=0.03,lowpass=f=750,volume=1.6" \
  -c:v libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -preset ultrafast -movflags +faststart \
  -c:a aac -b:a 128k public/videos/coastal_waves.mp4

rm -f public/videos/test.mp4 public/videos/test_fast.mp4
echo "COMPLETE"
