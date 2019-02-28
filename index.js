const request = require('request')
const { Observable } = require('rxjs')
const { map, flatMap, filter } = require('rxjs/operators')
const moment = require('moment')

moment.locale('fr')

const eventStartMoment = event => moment(event.event_start, "YYYY-MM-DD'T'HH:mm:ss'Z'").utc()
const eventEndMoment = event => moment(event.event_end, "YYYY-MM-DD'T'HH:mm:ss'Z'").utc()

const bzhcampEventToMd = event => `# ${event.format} ${event.name} - ${event.venue}
${eventStartMoment(event).format('dddd DD/MM HH:mm')} - ${eventEndMoment(event).format('HH:mm')}, by ${event.speakers}

${event.description}
`

const scheduleObservable = Observable.create(observer => {
        const options = {
            url: 'https://api.cfp.io/api/schedule',
            headers: { 'X-Tenant-Id': 'breizhcamp' }
        }
        request(options, (error, response, body) => {
            if (error) {
                observer.error(error)
            } else {
                observer.next(JSON.parse(body))
            }
            observer.complete()
        })
    })
    .pipe(
        map(events => events.sort((eventA, eventB) => eventStartMoment(eventA).valueOf() - eventStartMoment(eventB).valueOf())),
        flatMap(events => events),
        filter(event => event.active === 'Y'),
        map(bzhcampEventToMd)
    )

scheduleObservable.subscribe(
    eventAsText => console.log(eventAsText),
    error => console.error('😡😲😡 Failed to load schedule:', error),
    () => console.log('😊 Happy breizhcamp!')
)
