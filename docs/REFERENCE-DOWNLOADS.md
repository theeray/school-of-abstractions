# Reliable historical-reference preparation

## Observed failure

GitHub Actions run 39519130858, job 118958405139, checked commit
`a8d58d0d313c54c75bb1d596a666efa4a97ba397` successfully through the
101-file HD media installation. The reference downloader then fetched Raphael
and Blake before the Pieta download returned HTTP 429 (Too many requests).
The website tests, Google authentication and Firebase deployment did not run.
This was an external image-server rate limit, not evidence of broken Google
permissions or a failure in the Saige/glass layout changes.

Run: https://github.com/theeray/school-of-abstractions/actions/runs/39519130858

## Updated acquisition order

`scripts/fetch-reference-images.py` now uses:

1. A local file whose expected source URL, dimensions, byte count and SHA256
   match its saved metadata.
2. A copy on the existing School of Abstractions Firebase website. Its record
   is read only from the fixed HTTPS `art/reference-originals/sources.json`
   path. The source URL and dimensions must match the constants in the code;
   the downloaded JPEG must match its published byte count and SHA256.
3. The unchanged credited Wikimedia original, when no valid reusable copy is
   available. Retryable HTTP/connection failures have bounded retries.

The published metadata is trusted as this project's prior release record, not
represented as an independent cryptographic signature. No image URL from a
remote metadata field is followed. The requests use only fixed, approved HTTPS
hosts and reject disallowed redirects before issuing the redirected request.
The original image credits, dimensions, licenses, URLs and metadata schema are
preserved regardless of where identical bytes were retrieved.

HTTP 429, 408 and selected transient server failures are retried at most four
times in total. `Retry-After` seconds or HTTP dates are honored. In its absence,
the delay is 15, 30, then 60 seconds. If a server requests more than 120 seconds,
the downloader stops rather than retrying before the requested cooldown.
Permanent failures and invalid image data do not trigger repeated requests.

Each successfully verified file and its metadata are written atomically, so a
later failure does not discard all successfully downloaded work in that checkout.
The existing preflight still requires all three originals and their checksums;
no missing image is skipped and no placeholder is allowed through verification.

## Verification and deployment

`python3 tests/media-installer.test.py` passed all 33 local tests: the 12 prior
installer/parser tests plus 21 mocked downloader tests. They cover the observed
429, Retry-After, exhausted retries, safe origins/redirects, size checks, reusable
copies, corrupted copies, preservation of partial work and symbolic-link refusal.
Tests use no live HTTP calls. Outbound network access from the build container
was unavailable, so a live GitHub check is still required. No deployment is
claimed by this source update.

The existing workflow already runs this Python test file. No workflow trigger,
Google permission, billing, Firebase project, Hosting target, website layout,
image asset, or image-package upload is changed by this repair.

Start a NEW `Publish School of Abstractions` workflow on the latest `main`, with
operation `check`. Re-running the old failed run uses the old commit and does not
pick up this code. After the new check passes, run on the same revision with
operation `publish`; require its live-file verification before reporting success.
