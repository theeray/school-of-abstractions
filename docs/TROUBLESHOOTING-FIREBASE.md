# Diagnose a Firebase project-creation failure

A successful test run is not a deployment. A generic `Failed to create project` message does not identify the cause, prove that the project ID is taken, or establish ownership of the requested Hosting site.

From the same checkout where publishing failed:

```sh
git pull --ff-only && node scripts/diagnose-firebase.mjs
```

This reads the existing local `firebase-debug.log` without invoking Firebase or making any network request. It prints up to three structured error summaries: code, status, reason, and a message with common credentials and email addresses redacted. It does not print request headers or the full log, and it does not modify the log. Check the short summary before sharing it; do not upload the full debug log or credentials.

If the diagnostic reports that no structured error exists, stop and report that message rather than sharing raw logs. Logs remain excluded by the existing `*.log` rule.

Determine the next step from the actual error. A name conflict, missing create permission, quota restriction, and an existing Google Cloud project that has not yet had Firebase enabled require different handling. Do not silently select another account, project, or host.

The public Hosting site ID remains `school-of-abstractions`. An internal Google Cloud project ID can differ, but the desired Hosting site ID has its own global-uniqueness requirement; an internal project-ID change alone does not establish that the desired public hostname is available.

Official references:
- https://firebase.google.com/docs/cli
- https://firebase.google.com/docs/hosting/multisites
- https://docs.cloud.google.com/resource-manager/docs/creating-managing-projects
