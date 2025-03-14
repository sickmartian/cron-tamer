## ToDo

### Features

- Memory
- Samples
- Time Zone projection
- Sharing

### Issues

- [x] `0 0,1,2 30 * *` in march
- [x] test multi-row value
- [x] Not alignment for 30 and 31 on March
- [x] Step size adjustments break things, dots go below each other with small number, it just falls apart => bars
- [x] Cron schedule color doesn't match the grid's color, it selects the same one twice
- [x] Bad parsing of cron doesn't show a nice error, just fails
- [ ] Dark mode has non-visible text

### NTH

- [ ] Performance
- [ ] Double call to cron parsing shouldn't happen