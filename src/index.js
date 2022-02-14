import {Controller} from "@hotwired/stimulus"
import debounce from "lodash.debounce";
import operations from "./operations";

export class GoliveviewController extends Controller {
  static values = {
    url: String,
    eventId: String,
    selector: String,
    template: String,
    params: Object,
    redirect: String,
    debounceWait: {type: Number, default: 2000},
  }

  initialize() {
    let connectURL = `ws://${window.location.host}${window.location.pathname}`
    if (window.location.protocol === "https:") {
      connectURL = `wss://${window.location.host}${window.location.pathname}`
    }

    this.changeDebounced = debounce(this.changeDebounced, this.debounceWaitValue).bind(this);
    this.onSocketReconnect.bind(this);
    try {
      this.dispatcher = eventDispatcher(connectURL, [], this.onSocketReconnect, this.invokeOp)
    } catch (e) {
      console.error(e)
    }

  }

  connect() {
    if (this.redirectValue) {
      window.location.href = this.redirectValue
    }
  }

  redirectValueChanged() {
    if (this.redirectValue) {
      window.location.href = this.redirectValue
    }
  }

  onSocketReconnect = () => {
    if (this.dispatcher) {
      this.dispatcher("reconnect", null, null, null)
    }
  }


  invokeOp(eventData) {
    operations[eventData.op](eventData);
  }

  submit(e) {
    e.preventDefault()
    const {eventId, selector, template, ...rest} = e.params
    if (!eventId) {
      console.error("eventId is missing")
      return
    }
    let json = {...rest};
    const el = e.target;
    if (el) {
      if (el instanceof HTMLFormElement) {
        let formData = new FormData(el);
        formData.forEach((value, key) => json[key] = value);
      }

      if (el.form && el.form instanceof HTMLFormElement) {
        let formData = new FormData(el.form);
        formData.forEach((value, key) => json[key] = value);
      }

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        json[el.name] = el.value
      }
    }

    if (this.dispatcher) {
      this.dispatcher(eventId, selector, template, json)
      // reset form
      if (el) {
        if (el instanceof HTMLFormElement) {
        el.reset();
        }

        if (el.form && el.form instanceof HTMLFormElement) {
          el.form.reset();
        }
      }
    }
  }

  changeDebounced(e) {
    this.submit(e)
  }

  change(e) {
    this.submit(e)
  }

  navigate(e) {
    const {route} = e.params;
    if (!route) {
      return
    }
    window.location.href = route;
  }

}

const reopenTimeouts = [2000, 5000, 10000, 30000, 60000];

const eventDispatcher = (
    url,
    socketOptions,
    onSocketReconnect,
    invokeOp,
) => {
  let socket, openPromise, reopenTimeoutHandler;
  let reopenCount = 0;

  // socket code copied from https://github.com/arlac77/svelte-websocket-store/blob/master/src/index.mjs
  // thank you https://github.com/arlac77 !!
  function reopenTimeout() {
    const n = reopenCount;
    reopenCount++;
    return reopenTimeouts[
        n >= reopenTimeouts.length - 1 ? reopenTimeouts.length - 1 : n
        ];
  }

  function closeSocket() {
    if (reopenTimeoutHandler) {
      clearTimeout(reopenTimeoutHandler);
    }

    if (socket) {
      socket.close();
      socket = undefined;
    }
  }

  function reOpenSocket() {
    closeSocket();
    reopenTimeoutHandler = setTimeout(() => {

          onSocketReconnect()
          openSocket().then(() => {
            console.log("socket connected");
            // location.reload(true)
          }).catch(e => {
            console.error(e)
          })
        },
        reopenTimeout());
  }

  async function openSocket() {
    if (reopenTimeoutHandler) {
      clearTimeout(reopenTimeoutHandler);
      reopenTimeoutHandler = undefined;
    }

    // we are still in the opening phase
    if (openPromise) {
      return openPromise;
    }

    try {
      socket = new WebSocket(url, socketOptions);
    } catch (e) {
      console.log("socket disconnected")
    }


    socket.onclose = event => reOpenSocket();
    socket.onmessage = event => {
      try {
        const eventData = JSON.parse(event.data);
        if (eventData.op) {
          invokeOp(eventData);
        }
      } catch (e) {
      }

    };

    openPromise = new Promise((resolve, reject) => {
      socket.onerror = error => {
        reject(error);
        openPromise = undefined;
      };
      socket.onopen = event => {
        reopenCount = 0;
        resolve();
        openPromise = undefined;
      };
    });
    return openPromise;
  }

  openSocket().then(() => {}).catch(e => console.error(e));
  return (id, selector, template, params) => {
    if (!id) {
      throw 'event.id is required';
    }
    const event = {
      id: id,
      selector: selector,
      template: template,
      params: params
    }
    const send = () => socket.send(JSON.stringify(event));
    if (!socket || socket && socket.readyState !== WebSocket.OPEN) openSocket().then(send).catch(e => console.error(e));
    else send();
  }
}

