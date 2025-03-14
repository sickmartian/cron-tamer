## ToDo

### Features

- Memory
- Samples
- Time Zone projection
- Sharing

### Issues

- [ ] `0 0,1,2 30 * *` in march
- [ ] test multi-row value
- [x] Not alignment for 30 and 31 on March
- [x] Step size adjustments break things, dots go below each other with small number, it just falls apart => bars
- [ ] Bad parsing of cron doesn't show a nice error, just fails
- [ ] Cron schedule color doesn't match the grid's color, it selects the same one twice