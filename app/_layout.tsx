import { View, TouchableOpacity, Animated, Easing, Platform } from "react-native";
import { SplashScreen, Stack, usePathname, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useEffect, useRef, useState } from "react";
import { setUnauthorizedHandler } from "utils/api";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const router = useRouter();
	const [loaded, error] = useFonts({
		"Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
		"Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
		"Rubik-Italic": require("../assets/fonts/Rubik-Italic.ttf"),
		"Rubik-BoldItalic": require("../assets/fonts/Rubik-BoldItalic.ttf"),
		"Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
		"Rubik-MediumItalic": require("../assets/fonts/Rubik-MediumItalic.ttf"),
		"Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
		"Rubik-SemiBoldItalic": require("../assets/fonts/Rubik-SemiBoldItalic.ttf"),
		"Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
		"Rubik-ExtraBoldItalic": require("../assets/fonts/Rubik-ExtraBoldItalic.ttf"),
		"Rubik-Black": require("../assets/fonts/Rubik-Black.ttf"),
		"Rubik-BlackItalic": require("../assets/fonts/Rubik-BlackItalic.ttf"),
	});

	useEffect(() => {
		setUnauthorizedHandler(() => router.replace("/login"));
		return () => setUnauthorizedHandler(null);
	}, [router]);

	useEffect(() => {
		if (loaded || error) {
			SplashScreen.hideAsync();
		}
	}, [loaded, error]);

	if (!loaded && !error) {
		return null;
	}

	return (
		<SafeAreaView className="bg-main-gray flex-1">
			<Stack screenOptions={{ headerShown: false, animation: "none" }} />
			<Tabs />
		</SafeAreaView>
	);
}

export const Tabs = () => {
	const router = useRouter();
	const pathname = usePathname();

	const animatedValue = useRef(new Animated.Value(150)).current;
	const [isVisible, setIsVisible] = useState(false);

	const shouldShow = !pathname.includes("reader") && pathname !== "/login" && pathname !== "/register";

	useEffect(() => {
		if (shouldShow) {
			setIsVisible(true);
			Animated.timing(animatedValue, {
				toValue: 0,
				duration: 350,
				easing: Easing.out(Easing.cubic),
				useNativeDriver: Platform.OS !== "web",
			}).start();
		} else {
			Animated.timing(animatedValue, {
				toValue: 150,
				duration: 300,
				easing: Easing.in(Easing.cubic),
				useNativeDriver: Platform.OS !== "web",
			}).start(() => {
				setIsVisible(false);
			});
		}
	}, [shouldShow, animatedValue]);

	if (!isVisible) {
		return null;
	}

	const isActive = (path: string) => pathname === path;

	return (
		<Animated.View
			style={{
				transform: [{ translateY: animatedValue }],
				position: "absolute",
				bottom: 40,
				left: 24,
				right: 24,
				zIndex: 10,
			}}
		>
			<View className="flex rounded-full bg-main-graySecond">
				<View className="flex-row w-full justify-between px-2 h-[64px] items-center">
					<TouchableOpacity
						onPress={() => router.push("/")}
						className={`w-14 h-14 items-center justify-center rounded-full ${
							isActive("/") ? "bg-main-brand" : ""
						}`}
					>
						<MaterialIcons
							name="home"
							size={24}
							color={isActive("/") ? "white" : "#9ca3af"}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push("/likes")}
						className={`w-14 h-14 items-center justify-center rounded-full ${
							isActive("/likes") ? "bg-main-brand" : ""
						}`}
					>
						<Feather
							name="heart"
							size={24}
							color={isActive("/likes") ? "white" : "#9ca3af"}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push("/achivements")}
						className={`w-14 h-14 items-center justify-center rounded-full ${
							isActive("/achivements") ? "bg-main-brand" : ""
						}`}
					>
						<MaterialIcons
							name="emoji-events"
							size={24}
							color={isActive("/achivements") ? "white" : "#9ca3af"}
						/>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => router.push("/profile")}
						className={`w-14 h-14 items-center justify-center rounded-full ${
							isActive("/profile") ? "bg-main-brand" : ""
						}`}
					>
						<MaterialIcons
							name="person"
							size={24}
							color={isActive("/profile") ? "white" : "#9ca3af"}
						/>
					</TouchableOpacity>
				</View>
			</View>
		</Animated.View>
	);
};






