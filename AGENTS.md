# Architecture rules

- Keep checkout recovery account-scoped in local storage and show it only after a successful subscription check confirms no subscription on return; this avoids offering recovery to subscribers without adding marketing emails or changing billing.
- Use existing checkout plans for recovery offers; this preserves the configured prices and trial rules without introducing unapproved discounts.