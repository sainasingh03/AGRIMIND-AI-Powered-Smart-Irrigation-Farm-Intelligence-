import random


class QLearningAgent:

    def __init__(
        self,
        actions,
        learning_rate=0.1,
        discount_factor=0.9,
        epsilon=1.0
    ):

        self.actions = actions

        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon

        self.q_table = {}

    def get_q_values(self, state):

        if state not in self.q_table:
            self.q_table[state] = {
                action: 0.0
                for action in self.actions
            }

        return self.q_table[state]

    def choose_action(self, state):

        q_values = self.get_q_values(state)

        # Exploration
        if random.random() < self.epsilon:
            return random.choice(self.actions)

        # Exploitation
        return max(
            q_values,
            key=q_values.get
        )

    def update(
        self,
        state,
        action,
        reward,
        next_state
    ):

        q_values = self.get_q_values(state)
        next_q_values = self.get_q_values(next_state)

        current_q = q_values[action]

        max_future_q = max(
            next_q_values.values()
        )

        new_q = current_q + self.learning_rate * (
            reward
            + self.discount_factor * max_future_q
            - current_q
        )

        q_values[action] = new_q

    def reduce_exploration(self):

        self.epsilon = max(
            0.01,
            self.epsilon * 0.995
        )