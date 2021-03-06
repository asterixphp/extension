class Requests
{
	constructor () {
		this.items = []
	}

	// returns all requests up to the first placeholder, or everything if there are no placeholders
	all () {
		let placeholder = this.items.find(item => item.loading)

		return placeholder ? this.items.slice(0, this.items.indexOf(placeholder)) : this.items
	}

	// return request by id
	findId (id) {
		return this.items.find(request => request.id == id)
	}

	// loads request by id, inserts a placeholder to the items array which is replaced once the metadata is retrieved
	loadId (id) {
		let placeholder = new Request({ id: id, loading: true })
		this.items.push(placeholder)

		return this.callRemote(this.remoteUrl + id).then((data) => {
			this.items[this.items.indexOf(placeholder)] = data[0]
		})
	}

	// loads requests after the last request, if the count isn't specified loads all requests
	loadNext (count) {
		let lastId = this.items.length ? this.last().id : 'latest'

		return this.callRemote(this.remoteUrl + lastId + '/next' + (count ? '/' + count : '')).then((data) => {
			this.items.push(...data)
		})
	}

	// loads requests before the first request, if the count isn't specified loads all requests
	loadPrevious (count) {
		let firstId = this.items.length ? this.first().id : 'latest'

		return this.callRemote(this.remoteUrl + firstId + '/previous' + (count ? '/' + count : '')).then((data) => {
			this.items.unshift(...data)
		})
	}

	clear () {
		this.items = []
	}

	first () {
		return this.items[0]
	}

	last () {
		return this.items[this.items.length - 1]
	}

	setRemote (url, options) {
		options = options || {}
		options.path = options.path || '/__clockwork/'

		url = new URI(url)

		let [ pathname, query ] = options.path.split('?')
		url.pathname(pathname)
		url.query(query)

		this.remoteUrl = url.toString()
		this.remoteHeaders = options.headers || {}
	}

	callRemote (url) {
		return new Promise((accept, reject) => {
			chrome.runtime.sendMessage(
				{ action: 'getJSON', url, headers: this.remoteHeaders },
				(data) => {
					accept((data instanceof Array ? data : [ data ]).map(data => new Request(data)))
				}
			)
		})
	}
}
