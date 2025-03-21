## ToDo

### Features

- [x] Time Zone projection
- [ ] ~~Memory/Save~~ => Use sharing
- [x] Sharing
- [x] Samples
- [x] Select single day as well, show labels for columns and rows => vertical not aligning
- [x] Collisions

### Issues

- [x] TZ Select unreadable in dark mode
- [x] TZ Options centered instead of left aligned
- [x] Adding 1, removing 1, adding 1, results in the same color
- [x] Inter month
- [x] Inter day
- [x] `0 0,1,2 30 * *` in march
- [x] test multi-row value
- [x] Not alignment for 30 and 31 on March
- [x] Step size adjustments break things, dots go below each other with small number, it just falls apart => bars
- [x] Cron schedule color doesn't match the grid's color, it selects the same one twice
- [x] Bad parsing of cron doesn't show a nice error, just fails
- [x] Dark mode has non-visible text
- [x] Changing projection inside detailed day view breaks things, see last of month
- [x] Page title not updated
- [x] Remove cache when minute changes

### NTH

- [x] More TZs
- [x] More colors
- [x] Color selection after creation
- [x] Current time should show up in the calendar
- [x] Currently running jobs should be somehow highlighted
- [x] Current day should be shown differntly in the Calendar
- [x] Back button should be a calendar icon instead
- [x] Small jobs should show a smaller text, not skip it
- [x] Change title of app and window to user defined one
- [x] Editing the cron expression and name
- [x] Performance
  - [x] Double call to cron parsing shouldn't happen
  - [x] Inside cron editor we are calling the parsing for 2 months, that's a bit too much...
  - [ ] It's just very bad with recurrent things like `0 0/1 * * *`
  - [x] Gratuitus re-renders when anything changes
- [x] Branding
  - [x] Title
  - [x] Icons
- [x] Remove unused stuff, if any
- [ ] When long text and long cron exp, we want long text to win
- [ ] When long text and wrap, we want both lines to be aligned to the left to give the impression of a table
- [ ] Moving the expressions through the list
- [ ] Maybe add tests to some of the components logic, abstract it away, so we can check via snapshots, specially time zone and inter day or month logic