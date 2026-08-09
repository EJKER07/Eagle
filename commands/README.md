# Command layout

The production command modules live under `src/commands/` and are loaded recursively.
They are grouped into utility, moderation, music, tickets, security, configuration,
economy, and leveling categories. The top-level folders are retained as a predictable
extension point for integrations; do not load both trees.
