import { useRef, useState } from "react";
import { Animated, PanResponder, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "./text";

export function SwipeButton({
	onSwipe,
	text,
	className,
	onPanResponderMove,
	onPanResponderRelease,
}: {
	onSwipe: () => void;
	text?: string;
	className?: string;
	onPanResponderMove?: () => void;
	onPanResponderRelease?: () => void;
}) {
	const translateX = useRef(new Animated.Value(0)).current;
	const [isActive, setIsActive] = useState(false);
	const panResponder = useRef(
		PanResponder.create({
			onMoveShouldSetPanResponder: (_, gestureState) =>
				!isActive && Math.abs(gestureState.dx) > 10,

			onPanResponderMove: (_, gestureState) => {
				if (onPanResponderMove) onPanResponderMove();
				if (!isActive && gestureState.dx > 0) {
					translateX.setValue(gestureState.dx);
				}
			},

			onPanResponderRelease: () => {
				if (isActive) return;
				if (onPanResponderRelease) onPanResponderRelease();

				translateX.stopAnimation((value) => {
					const endValue = value > 150 ? 300 : 0;

					Animated.timing(translateX, {
						toValue: endValue,
						duration: 200,
						useNativeDriver: Platform.OS !== "web",
					}).start(() => {
						if (endValue === 300) {
							setIsActive(true);
							onSwipe();
						}
					});
				});
			},
		}),
	).current;

	const backgroundColor = translateX.interpolate({
		inputRange: [0, 300],
		outputRange: ["#3E4043", "#F03A52"],
		extrapolate: "clamp",
	});

	return (
		<Animated.View
			style={{ backgroundColor }}
			className={`h-[64px] rounded-full justify-center overflow-hidden ${className}`}
		>
			<ThemedText className="text-white/60 text-[16px] absolute self-center">
				{text}
			</ThemedText>

			<Animated.View
				{...(!isActive ? panResponder.panHandlers : {})}
				style={{ transform: [{ translateX }] }}
				className="absolute left-2 w-[54px] h-[54px] rounded-full bg-[#F03A52] justify-center items-center"
			>
				<MaterialIcons name="arrow-forward" size={28} color="white" />
			</Animated.View>
		</Animated.View>
	);
}

