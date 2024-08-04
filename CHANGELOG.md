# Change Log

All notable changes to the "Neo Copilot" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]
- Remove suggestion when cursor position is changed after the suggestion is received.
- Remove suggestion when cursor position is changed while the suggestion is being received.

### Added
- Initial release of Neo Copilot, an intelligent code suggestion tool to boost productivity and streamline coding workflow.
- Support for various programming languages with intelligent auto-completion and suggestions.
- Integration with LLMs to provide advanced code predictions.

## [0.100.13] - 2024-08-04

### Added
- Handled block comment actions (no prediction will be shown for such actions).
- Resolved issue in running prediction.
- Added support for special characters in running prediction.
- Enhanced suggestions based on the user's position in the text.