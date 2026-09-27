#!/usr/bin/env bash
# =============================================================================
#  MANYAK TV v2 — FFmpeg HLS Transcoding Script
#
#  Foydalanish:
#    ./transcode-hls.sh <input_file> <content_id> [output_dir]
#
#  Natija:
#    {output_dir}/{content_id}/
#      ├── master.m3u8          ← Barcha sifat variantlari
#      ├── 480p/
#      │   ├── 480p.m3u8
#      │   └── 480p_seg000.ts, ...
#      ├── 720p/
#      │   ├── 720p.m3u8
#      │   └── 720p_seg000.ts, ...
#      └── 1080p/
#          ├── 1080p.m3u8
#          └── 1080p_seg000.ts, ...
# =============================================================================

set -euo pipefail

INPUT="${1:-}"
CONTENT_ID="${2:-}"
OUTPUT_BASE="${3:-/app/hls-output}"

# ─── Input tekshirish ──────────────────────────────────────────────────
if [[ -z "$INPUT" || -z "$CONTENT_ID" ]]; then
    echo "❌ Foydalanish: $0 <input_file> <content_id> [output_dir]"
    exit 1
fi

if [[ ! -f "$INPUT" ]]; then
    echo "❌ Fayl topilmadi: $INPUT"
    exit 1
fi

if ! command -v ffmpeg &>/dev/null; then
    echo "❌ ffmpeg o'rnatilmagan!"
    exit 1
fi

OUTPUT_DIR="${OUTPUT_BASE}/${CONTENT_ID}"
mkdir -p "$OUTPUT_DIR"/{480p,720p,1080p}

echo "▶ Transcoding boshlandi: $INPUT"
echo "▶ Content ID: $CONTENT_ID"
echo "▶ Output: $OUTPUT_DIR"

# ─── HLS segment vaqti (sekundda) ────────────────────────────────────────
SEGMENT_TIME=6   # 6 soniya har bir .ts segment

# =============================================================================
#  FFmpeg: 3 ta sifat varianti parallel render
#
#  480p  — 854x480   @ 800k  video + 96k  audio  (~MB/saat uchun kichik)
#  720p  — 1280x720  @ 2500k video + 128k audio  (standart HD)
#  1080p — 1920x1080 @ 5000k video + 192k audio  (Full HD)
#
#  -hls_time           : segment davomiyligi
#  -hls_list_size 0    : barcha segmentlarni m3u8'da saqlash
#  -hls_segment_type   : ts (MPEG-TS) yoki fmp4 (modern)
#  -hls_flags          : delete_segments = eski segmentlarni tozalash
# =============================================================================

ffmpeg -y \
    -i "$INPUT" \
    -filter_complex "\
        [0:v]split=3[v1][v2][v3]; \
        [v1]scale=854:480:force_original_aspect_ratio=decrease,pad=854:480:(ow-iw)/2:(oh-ih)/2[v480]; \
        [v2]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v720]; \
        [v3]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[v1080] \
    " \
    \
    -map "[v480]"  -map 0:a \
    -c:v:0 libx264  -preset fast  -crf 23  -b:v:0 800k  -maxrate:v:0 900k   -bufsize:v:0 1800k \
    -c:a:0 aac  -b:a:0 96k  -ar 44100 \
    -hls_time "$SEGMENT_TIME" \
    -hls_list_size 0 \
    -hls_segment_filename "$OUTPUT_DIR/480p/480p_seg%03d.ts" \
    -hls_flags independent_segments \
    "$OUTPUT_DIR/480p/480p.m3u8" \
    \
    -map "[v720]"  -map 0:a \
    -c:v:1 libx264  -preset fast  -crf 22  -b:v:1 2500k -maxrate:v:1 2800k  -bufsize:v:1 5600k \
    -c:a:1 aac  -b:a:1 128k -ar 44100 \
    -hls_time "$SEGMENT_TIME" \
    -hls_list_size 0 \
    -hls_segment_filename "$OUTPUT_DIR/720p/720p_seg%03d.ts" \
    -hls_flags independent_segments \
    "$OUTPUT_DIR/720p/720p.m3u8" \
    \
    -map "[v1080]" -map 0:a \
    -c:v:2 libx264  -preset fast  -crf 21  -b:v:2 5000k -maxrate:v:2 5500k  -bufsize:v:2 11000k \
    -c:a:2 aac  -b:a:2 192k -ar 44100 \
    -hls_time "$SEGMENT_TIME" \
    -hls_list_size 0 \
    -hls_segment_filename "$OUTPUT_DIR/1080p/1080p_seg%03d.ts" \
    -hls_flags independent_segments \
    "$OUTPUT_DIR/1080p/1080p.m3u8" \
    2>&1 | tee "${OUTPUT_DIR}/transcode.log"

# ─── Master playlist yaratish ────────────────────────────────────────────
cat > "$OUTPUT_DIR/master.m3u8" <<EOF
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=900000,RESOLUTION=854x480,CODECS="avc1.42e01e,mp4a.40.2",NAME="480p"
480p/480p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2700000,RESOLUTION=1280x720,CODECS="avc1.4d001f,mp4a.40.2",NAME="720p"
720p/720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5200000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2",NAME="1080p"
1080p/1080p.m3u8
EOF

echo ""
echo "✔ Transcode tayyor!"
echo "✔ Master playlist: $OUTPUT_DIR/master.m3u8"
echo "└ Variantlar: 480p | 720p | 1080p"

# DB da transcode_status ni 'ready' ga yangilash (NestJS API orqali)
# API_URL="http://localhost:3001"
# curl -s -X PATCH "$API_URL/api/v1/admin/content/$CONTENT_ID/transcode-status" \
#      -H "Content-Type: application/json" \
#      -d '{"status":"ready","qualities":["480p","720p","1080p"]}'

echo "✔ Completed at: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
