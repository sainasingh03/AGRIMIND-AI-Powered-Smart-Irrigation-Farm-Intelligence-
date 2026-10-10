import joblib
from environment import IrrigationEnvironment
from agent import QLearningAgent


ACTIONS = [
    "NO_WATER",
    "LOW_WATER",
    "MEDIUM_WATER",
    "HIGH_WATER"
]


def train_agent(episodes=1000):

    environment = IrrigationEnvironment()

    agent = QLearningAgent(
        actions=ACTIONS
    )

    rewards = []

    for episode in range(episodes):

        state = environment.reset()

        total_reward = 0

        for step in range(50):

            action = agent.choose_action(state)

            next_state, reward = environment.step(action)

            agent.update(
                state,
                action,
                reward,
                next_state
            )

            state = next_state

            total_reward += reward

        agent.reduce_exploration()

        rewards.append(total_reward)

        if (episode + 1) % 100 == 0:

            print(
                f"Episode {episode + 1} "
                f"| Reward: {total_reward:.2f} "
                f"| Epsilon: {agent.epsilon:.3f}"
            )

    return agent, rewards


if __name__ == "__main__":

    agent, rewards = train_agent(1000)
    
    joblib.dump(
        agent.q_table,
        "../../models/q_table.pkl"
    )

    print("\nTraining completed!")

    print(
        f"States learned: "
        f"{len(agent.q_table)}"
    )