from pynput import keyboard
import time


class KeyboardTracker:

    def __init__(self):

        self.key_count = 0
        self.start_time = time.time()
        self.last_key_time = time.time()
        self.listener = None

    def on_press(self, key):

        self.key_count += 1
        self.last_key_time = time.time()

    def start(self):
        if self.listener is not None:
            return

        self.listener = keyboard.Listener(on_press=self.on_press)
        self.listener.daemon = True
        self.listener.start()

    def stop(self):
        if self.listener is None:
            return

        self.listener.stop()
        self.listener = None

    def get_typing_speed(self):

        elapsed = time.time() - self.start_time

        if elapsed == 0:
            return 0

        return round((self.key_count / elapsed) * 60, 2)

    def get_idle_time(self):

        return round(time.time() - self.last_key_time, 2)

    def reset(self):
        self.key_count = 0
        self.start_time = time.time()
        self.last_key_time = time.time()
