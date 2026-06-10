"""PWA 아이콘 생성 스크립트.

앱의 브랜드 캐릭터(틸 배경 + 골드 얼굴)를 PNG로 그려서 icons/ 폴더에 저장한다.
실행: python3 make_icons.py
"""

import math
import os
import struct
import zlib

TEAL = (21, 94, 99)
GOLD = (244, 185, 66)
INK = (23, 32, 38)


def write_png(path, size, pixels):
    def chunk(typ, data):
        block = struct.pack(">I", len(data)) + typ + data
        return block + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)

    raw = b"".join(
        b"\x00" + b"".join(struct.pack("BBBB", *px) for px in row) for row in pixels
    )
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)


def draw_icon(size):
    radius = size * 0.21
    face_cx, face_cy, face_r = size / 2, size / 2, size * 0.33
    eye_r = size * 0.034
    eye_dx, eye_dy = size * 0.115, size * 0.075
    smile_r, smile_t = size * 0.17, size * 0.026
    smile_cy = face_cy + size * 0.01

    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            # 둥근 사각형 배경
            inside = True
            for cx, cy in (
                (radius, radius),
                (size - radius, radius),
                (radius, size - radius),
                (size - radius, size - radius),
            ):
                if (x < radius and y < radius and cx == radius and cy == radius) or (
                    x > size - radius and y < radius and cx == size - radius and cy == radius
                ) or (x < radius and y > size - radius and cx == radius and cy == size - radius) or (
                    x > size - radius and y > size - radius and cx == size - radius and cy == size - radius
                ):
                    if math.hypot(x - cx, y - cy) > radius:
                        inside = False
                    break
            if not inside:
                row.append((0, 0, 0, 0))
                continue

            color = TEAL
            d_face = math.hypot(x - face_cx, y - face_cy)
            if d_face <= face_r:
                color = GOLD
                for ex in (face_cx - eye_dx, face_cx + eye_dx):
                    if math.hypot(x - ex, y - (face_cy - eye_dy)) <= eye_r:
                        color = INK
                d_smile = math.hypot(x - face_cx, y - smile_cy)
                if (
                    smile_r - smile_t <= d_smile <= smile_r + smile_t
                    and y - smile_cy >= smile_r * 0.35
                ):
                    color = INK
            row.append((*color, 255))
        rows.append(row)
    return rows


def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
    os.makedirs(out, exist_ok=True)
    for size in (180, 192, 512):
        write_png(os.path.join(out, f"icon-{size}.png"), size, draw_icon(size))
        print(f"icon-{size}.png 생성 완료")


if __name__ == "__main__":
    main()
