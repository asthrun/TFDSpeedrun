import Link from "next/link";

export function LegalNotice() {
  return (
    <div className="space-y-3 text-xs leading-5 text-zinc-500">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <Link
          href="/terms"
          className="underline underline-offset-4 transition hover:text-zinc-300"
        >
          Terms of Service
        </Link>

        <Link
          href="/privacy"
          className="underline underline-offset-4 transition hover:text-zinc-300"
        >
          Privacy Policy
        </Link>
      </div>

      <p>
        TFDSpeedrun is an independent community tool and is not affiliated
        with, endorsed by, sponsored by, or otherwise associated with NEXON
        Korea Corp. or NEXON Games Co., Ltd.
      </p>

      <p>
        The First Descendant and related names, trademarks, artwork, game
        content, and other intellectual property belong to their respective
        owners. © NEXON Korea Corp. &amp; NEXON Games Co, LTD. All Rights
        Reserved.
      </p>
    </div>
  );
}