import React, {useState, useEffect, useRef} from 'react';
import {
    Animated,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    ActivityIndicator,
    View,
    Platform,
    SafeAreaView
} from "react-native";
import type {IUserStoryItem} from "./interfaces/IUserStory";
import {usePrevious} from "./helpers/StateHelpers";
import {isNullOrWhitespace} from "./helpers/ValidationHelpers";
import GestureRecognizer from 'react-native-swipe-gestures';

const {width, height} = Dimensions.get('window');

type Props = {
    profileName: string,
    profileImage: string,
    duration?: number,
    onFinish?: function,
    onClosePress: function,
    onNext?: function,
    onPrevious?: function,
    key: number,
    swipeText?: string,
    customSwipeUpComponent?: () => ReactDOMComponent,
    customCloseComponent?: any,
    stories: IUserStoryItem[],
    showBlurredBackground?: function,
    shouldCloseOnSwipeUp?: boolean,
    currentStory?: number,
    currentPage?: number,
};


export const StoryListItem = (props: Props) => {
    const stories = props.stories;

    const [load, setLoad] = useState(true);
    const [pressed, setPressed] = useState(false);
    const [currentImageHeight, setCurrentImageHeight] = useState(0);
    const prevCurrentPage = usePrevious(props.currentPage);
    const [content, setContent] = useState(
        stories.map((x) => {
            return {
                ...x,
                image: x.story_image,
                onPress: x.onPress,
                swipeText: x.swipeText,
                finish: 0
            }
        }));
    const [current, setCurrent] = useState(props?.lastSeen);

    const progress = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const updatedContent = stories.map((x) => {
            return {
                ...x,
                image: x.story_image,
                onPress: x.onPress,
                swipeText: x.swipeText,
                finish: 0
            }
        });
        setContent(updatedContent);
    }, [stories]);

    React.useEffect(() => {
        if(content[current]?.image) {
            Image.getSize(content[current]?.image, (width, height) => {
                setCurrentImageHeight(height);    
            });
        }
    }, [current])

    useEffect(() => {
        let current = props?.lastSeen || 0;
        let data = [...content];
        
        data.map((x, i) => {
            x.finish = current < i ? 0 : 1;
        })
        setCurrent(current);
        setContent(data);
        start();
    }, [props.currentPage]);

    const prevCurrent = usePrevious(current);

    useEffect(() => {
        if (!isNullOrWhitespace(prevCurrent)) {
            if (current > prevCurrent && content[current - 1]?.image == content[current]?.image) {
                start();
            } else if (current < prevCurrent && content[current + 1]?.image == content[current]?.image) {
                start();
            }
        }

    }, [current]);

    function start() {
        setLoad(false);
        progress.setValue(0);
        startAnimation();
    }

    function startAnimation() {
        Animated.timing(progress, {
            toValue: 1,
            duration: props.duration,
            useNativeDriver: false
        }).start(({finished}) => {
            if (finished) {
                next();
            }
        });
    }

    function onSwipeUp() {
        if (props?.shouldCloseOnSwipeUp && props.onClosePress) {
            props.onClosePress(stories[current]);
        }
        if (content[current].onPress) {
            content[current].onPress(stories[current]);
        }
    }

    function onSwipeDown() {
        props?.onClosePress();
    }

    const config = {
        velocityThreshold: 0.3,
        directionalOffsetThreshold: 80
    };

    function next() {
        // check if the next content is not empty
        setLoad(true);
        if (current !== content.length - 1) {
            const nextIndex = current + 1;
            let data = [...content];
            
            if(data[current])
                data[current].finish = 1;
            
            setContent(data);
            setCurrent(nextIndex);
            progress.setValue(0);
            props?.onNext && props?.onNext(content?.[nextIndex], nextIndex);
        } else {
            // the next content is empty
            close('next');
        }
    }

    function previous() {
        // checking if the previous content is not empty
        setLoad(true);
        if (current - 1 >= 0) {
            const previousIndex = current - 1;
            let data = [...content];
            data[current].finish = 0;
            setContent(data);
            setCurrent(previousIndex);
            progress.setValue(0);
            props?.onPrevious && props?.onPrevious(content?.[previousIndex], previousIndex);
        } else {
            // the previous content is empty
            close('previous');
        }
    }

    function close(state) {
        let data = [...content];
        data.map(x => x.finish = 0);
        setContent(data);
        progress.setValue(0);
        if (props.currentPage == props.index) {
            if (props.onFinish) {
                props.onFinish(state);
            }
        }
    }

    const swipeText = content?.[current]?.swipeText || props.swipeText || 'Swipe Up';

    if(!content[current]) { return <></>}

    return (
        <GestureRecognizer
            onSwipeUp={(state) => onSwipeUp(state)}
            onSwipeDown={(state) => onSwipeDown(state)}
            config={config}
            style={{
                flex: 1,
                backgroundColor: 'black'
            }}
        >
            <Image
                source={{ uri: content[current-2]?.image }}
                resizeMode="cover"
                blurRadius={30}
                style={{ position: 'absolute', height: 0, width: 0 }}
            /><Image
                source={{ uri: content[current-1]?.image }}
                resizeMode="cover"
                blurRadius={30}
                style={{ position: 'absolute', height: 0, width: 0 }}
            />
            <Image
                source={{ uri: content[current+1]?.image }}
                resizeMode="cover"
                blurRadius={30}
                style={{ position: 'absolute', height: 0, width: 0 }}
            />
            <Image
                source={{ uri: content[current+2]?.image }}
                resizeMode="cover"
                blurRadius={30}
                style={{ position: 'absolute', height: 0, width: 0 }}
            />
            {props?.showBlurredBackground(content[current]) && !!content[current]?.image && (
                <Image
                    source={{ uri: content[current]?.image }}
                    style={styles.backdrop}
                    resizeMode="cover"
                    blurRadius={30}
                />
            )}
            <View style={styles.backgroundContainer}>
                { !!content[current]?.image && (
                    <Image 
                        onLoadStart={() => setLoad(true)}
                        onLoadEnd={start}
                        source={{ uri: content[current]?.image }}
                        resizeMode="contain"
                        style={[styles.image, { height: currentImageHeight}]}
                    />
                )}
                {load && <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color={'white'}/>
                </View>}
            </View>
            <SafeAreaView>
            </SafeAreaView>
            <View style={{flexDirection: 'column', flex: 1,}}>
                <View style={styles.animationBarContainer}>
                    {content.map((index, key) => {
                        return (
                            <View key={key} style={styles.animationBackground}>
                                <Animated.View
                                    style={{
                                        flex: current == key ? progress : content[key].finish,
                                        height: 2,
                                        backgroundColor: 'white',
                                    }}
                                />
                            </View>
                        );
                    })}
                </View>
                <View style={styles.userContainer}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Image style={styles.avatarImage}
                               source={{uri: props.profileImage}}
                        />
                        <Text style={styles.avatarText}>{props.profileName}</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                        if (props.onClosePress) {
                            props.onClosePress();
                        }
                    }}>
                        <View style={styles.closeIconContainer}>
                            {props.customCloseComponent ?
                                props.customCloseComponent :
                                <Text style={{color: 'white'}}>X</Text>
                            }
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.pressContainer}>
                    <TouchableWithoutFeedback
                        onPressIn={() => progress.stopAnimation()}
                        onLongPress={() => setPressed(true)}
                        onPressOut={() => {
                            setPressed(false);
                            startAnimation();
                        }}
                        onPress={() => {
                            if (!pressed && !load) {
                                previous()
                            }
                        }}
                    >
                        <View style={{flex: 1}}/>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPressIn={() => progress.stopAnimation()}
                                              onLongPress={() => setPressed(true)}
                                              onPressOut={() => {
                                                  setPressed(false);
                                                  startAnimation();
                                              }}
                                              onPress={() => {
                                                  if (!pressed && !load) {
                                                      next()
                                                  }
                                              }}>
                        <View style={{flex: 1}}/>
                    </TouchableWithoutFeedback>
                </View>
            </View>
            {content[current]?.onPress &&
                <TouchableOpacity activeOpacity={1}
                                  onPress={onSwipeUp}
                                  style={styles.swipeUpBtn}>
                    {props.customSwipeUpComponent ?
                        props.customSwipeUpComponent(content[current], current) :
                        <>
                            <Text style={{color: 'white', marginTop: 5}}></Text>
                            <Text style={{color: 'white', marginTop: 5}}>{swipeText}</Text>
                        </>
                    }
                </TouchableOpacity>}
        </GestureRecognizer>
    )
}


export default StoryListItem;

StoryListItem.defaultProps = {
    duration: 10000
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 7,
        right: 7,
        display: 'flex',
        flex: 1,
        height,
        justifyContent: 'center',
    },
    spinnerContainer: {
        zIndex: -100,
        position: "absolute",
        justifyContent: 'center',
        backgroundColor: 'black',
        alignSelf: 'center',
        width: width,
        height: height,
    },
    animationBarContainer: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingHorizontal: 10,
    },
    animationBackground: {
        height: 2,
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(117, 117, 117, 0.5)',
        marginHorizontal: 2,
    },
    userContainer: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    avatarImage: {
        height: 30,
        width: 30,
        borderRadius: 100
    },
    avatarText: {
        fontWeight: 'bold',
        color: 'white',
        paddingLeft: 10,
    },
    closeIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        paddingHorizontal: 15,
    },
    pressContainer: {
        flex: 1,
        flexDirection: 'row'
    },
    swipeUpBtn: {
        position: 'absolute',
        right: 0,
        left: 0,
        alignItems: 'center',
        bottom: Platform.OS == 'ios' ? 20 : 50
    },
    backdrop: { 
        ...StyleSheet.absoluteFill
    }
});
