export default class Controller {
  #view;
  #camera;
  #worker;
  #blinkCounter = 0;
  constructor({ view, camera, worker }) {
    this.#view = view;
    this.#camera = camera;
    this.#worker = this.#configureWorker(worker);

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
  }

  static async initialize(deps) {
    const controller = new Controller(deps);
    controller.log(
      `Not yet detecting eye blink! Click in the button to start.`
    );
    return controller.init();
  }

  async init() {
    console.log("INIT CONTROLLER");
  }

  log(text) {
    const times = `      - blinked times: ${this.#blinkCounter}`;
    this.#view.log(`status: ${text} `.concat(this.#blinkCounter ? times : ""));
  }

  onBtnStart() {
    this.log("Initializing detection...");
    this.#blinkCounter = 0;
    this.loop();
  }

  loop() {
    const video = this.#camera.video;
    const img = this.#view.getVideoFrame(video);

    this.#worker.send(img);
    this.log("DETECTING EYE BLINK");
    setTimeout(() => this.loop(), 100);
  }

  // Private methods
  #configureWorker(worker) {
    let ready = false;
    worker.onmessage = ({ data }) => {
      if (data === "READY") {
        console.log("CONTROLLER WORKER READY");
        ready = true;
        return this.#view.enableButton();
      }

      const blinked = data.blinked;
      this.#blinkCounter += blinked;
      this.#view.togglePlayVideo();

      console.log({ blinked });
    };

    return {
      send(msg) {
        if (!ready) return;
        worker.postMessage(msg);
      },
    };
  }
}
