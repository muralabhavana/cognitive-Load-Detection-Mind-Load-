from pynput import mouse
import time
import math


class MouseTracker:

    def __init__(self):

        self.clicks = 0

        self.last_position = None

        self.total_distance = 0

        self.start_time = time.time()

        self.last_move_time = time.time()
        self.listener = None

    # Mouse movement
    def on_move(self, x, y):

        if self.last_position is not None:

            dx = x - self.last_position[0]
            dy = y - self.last_position[1]

            distance = math.sqrt(dx**2 + dy**2)

            self.total_distance += distance

        self.last_position = (x, y)
        self.last_move_time = time.time()

    # Mouse click
    def on_click(self, x, y, button, pressed):

        if pressed:
            self.clicks += 1

    # Start listener
    def start(self):
        if self.listener is not None:
            return

        self.listener = mouse.Listener(
            on_move=self.on_move,
            on_click=self.on_click
        )

        self.listener.daemon = True
        self.listener.start()

    def stop(self):
        if self.listener is None:
            return

        self.listener.stop()
        self.listener = None

    # Pixels moved per second
    def get_mouse_speed(self):

        elapsed = time.time() - self.start_time

        if elapsed <= 0:
            return 0

        return round(self.total_distance / elapsed, 2)

    # Idle time
    def get_idle_time(self):

        return round(time.time() - self.last_move_time, 2)

    # Click count
    def get_clicks(self):

        return self.clicks

    def reset(self):
        self.clicks = 0
        self.last_position = None
        self.total_distance = 0
        self.start_time = time.time()
        self.last_move_time = time.time()
