# -*- coding: utf-8 -*-
"""みらい Phase1/2 整理資料 HTML を Surge に公開する（メールでリンク共有用）。"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HTML_SRC = Path(r"c:\Users\o9o15\mirai-supervisor-phase2-request.html")
DOMAIN = "diagram-mirai-supervisor-phase2.surge.sh"


def _surge() -> list[str]:
    cmd = Path(os.environ.get("APPDATA", "")) / "npm" / "surge.cmd"
    if cmd.is_file():
        return [str(cmd)]
    return ["surge"]


def main() -> int:
    if not HTML_SRC.is_file():
        print(f"エラー: {HTML_SRC} が見つかりません", file=sys.stderr)
        return 1

    r = subprocess.run(_surge() + ["whoami"], capture_output=True, text=True)
    if r.returncode != 0:
        print("エラー: surge にログインしていません。次を実行してから再試行してください。", file=sys.stderr)
        print("  surge login", file=sys.stderr)
        print("  または: npx surge login", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        shutil.copy2(HTML_SRC, root / "index.html")
        (root / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")

        print("デプロイ中...")
        r = subprocess.run(
            _surge() + [".", "--domain", DOMAIN],
            cwd=str(root),
        )
        if r.returncode != 0:
            return r.returncode

    print("")
    print("完了！")
    print(f"公開URL: https://{DOMAIN}/")
    print("メールにはこのURLを貼って共有してください。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
