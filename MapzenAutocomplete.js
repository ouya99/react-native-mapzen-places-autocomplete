import React, { PropTypes } from 'react';
import { TextInput, View, ListView, Image, Text, Dimensions, TouchableHighlight, TouchableWithoutFeedback, Platform, ActivityIndicator, PixelRatio } from 'react-native';
import Qs from 'qs';

const defaultStyles = {
  container: {
    flex: 1,
  },
  textInputContainer: {
    backgroundColor: '#C9C9CE',
    height: 44,
    borderTopColor: '#7e7e7e',
    borderBottomColor: '#b5b5b5',
    borderTopWidth: 1 / PixelRatio.get(),
    borderBottomWidth: 1 / PixelRatio.get(),
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    height: 28,
    borderRadius: 5,
    paddingTop: 4.5,
    paddingBottom: 4.5,
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 7.5,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 15,
  },
  poweredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  powered: {
    marginTop: 15,
  },
  listView: {
    // flex: 1,
  },
  row: {
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  separator: {
    height: 1,
    backgroundColor: '#c8c7cc',
  },
  description: {
  },
  loader: {
    // flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
  androidLoader: {
    marginRight: -15,
  },
};

const MapzenPlacesAutocomplete = React.createClass({

  propTypes: {
    placeholder: React.PropTypes.string,
    placeholderTextColor: React.PropTypes.string,
    onPress: React.PropTypes.func,
    minLength: React.PropTypes.number,
    fetchDetails: React.PropTypes.bool,
    autoFocus: React.PropTypes.bool,
    getDefaultValue: React.PropTypes.func,
    timeout: React.PropTypes.number,
    onTimeout: React.PropTypes.func,
    query: React.PropTypes.object,
    MapzenReverseGeocodingQuery: React.PropTypes.object,
    MapzenPlacesSearchQuery: React.PropTypes.object,
    styles: React.PropTypes.object,
    textInputProps: React.PropTypes.object,
    enablePoweredByContainer: React.PropTypes.bool,
    predefinedPlaces: React.PropTypes.array,
    currentLocation: React.PropTypes.bool,
    currentLocationLabel: React.PropTypes.string,
    nearbyPlacesAPI: React.PropTypes.string,
    filterReverseGeocodingByTypes: React.PropTypes.array,
    predefinedPlacesAlwaysVisible: React.PropTypes.bool,
    enableEmptySections: React.PropTypes.bool
  },

  getDefaultProps() {
    return {
      placeholder: 'Search',
      placeholderTextColor: '#A8A8A8',
      onPress: () => {},
      minLength: 0,
      fetchDetails: false,
      autoFocus: false,
      getDefaultValue: () => '',
      timeout: 20000,
      onTimeout: () => console.warn('mapzen places autocomplete: request timeout'),
      query: {
        key: 'missing api key',
        language: 'en',
        types: 'geocode',
      },
      MapzenReverseGeocodingQuery: {
      },
      MapzenPlacesSearchQuery: {
        rankby: 'distance',
        types: 'food',
      },
      styles: {
      },
      textInputProps: {},
      enablePoweredByContainer: true,
      predefinedPlaces: [],
      currentLocation: false,
      currentLocationLabel: 'Current location',
      nearbyPlacesAPI: 'MapzenPlacesSearch',
      filterReverseGeocodingByTypes: [],
      predefinedPlacesAlwaysVisible: false,
      enableEmptySections: true
    };
  },

  getInitialState() {
    const ds = new ListView.DataSource({rowHasChanged: function rowHasChanged(r1, r2) {
      if (typeof r1.isLoading !== 'undefined') {
        return true;
      }
      return r1 !== r2;
    }});
    return {
      text: this.props.getDefaultValue(),
      dataSource: ds.cloneWithRows(this.buildRowsFromResults([])),
      listViewDisplayed: false,
    };
  },

  setAddressText(address) {
    this.setState({ text: address })
  },

  buildRowsFromResults(results) {
    var res = null;

    if (results.length === 0 || this.props.predefinedPlacesAlwaysVisible === true) {
      res = [...this.props.predefinedPlaces];
      if (this.props.currentLocation === true) {
        res.unshift({
          properties: {label: "Current location"},
          description: this.props.currentLocationLabel,
          isCurrentLocation: true,
        });
      }
    } else {
      res = [];
    }

    res = res.map(function(place) {
      return {
        ...place,
        isPredefinedPlace: true,
      }
    });

    return [...res, ...results];
  },

  componentWillUnmount() {
    this._abortRequests();
  },

  _abortRequests() {
    for (let i = 0; i < this._requests.length; i++) {
      this._requests[i].abort();
    }
    this._requests = [];
  },

  /**
   * This method is exposed to parent components to focus on textInput manually.
   * @public
   */
  triggerFocus() {
    if (this.refs.textInput) this.refs.textInput.focus();
  },

  /**
   * This method is exposed to parent components to blur textInput manually.
   * @public
   */
  triggerBlur() {
    if (this.refs.textInput) this.refs.textInput.blur();
  },

getCurrentLocation() {
  var self = this;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
          self._requestNearby(position.coords.latitude, position.coords.longitude);

          alert("current position is : LAT : " + position.coords.latitude + " / LNG : " + position.coords.longitude);
        },
        (error) => alert(error.message),
        {enableHighAccuracy: true, timeout: 10000, maximumAge: 1000}
      );
  };
},

  // getCurrentLocation() {
    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     // this._requestNearby(position.coords.latitude, position.coords.longitude);
    //   },
    //   (error) => {
    //     this._disableRowLoaders();
    //     if (error.code <= 2) { // timeout
    //       alert("you have no gps or other problem - high accuracy");
    //     }
    //     if (error.code == 3) { // timeout
    //       alert("search timed out");
    //       this.getLowAccuracyLocation();
    //     }
    //   },
    //   {enableHighAccuracy: true, timeout: 5000, maximumAge: 1000}
    // );
  // },

  getLowAccuracyLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
      },
      (error) => {
        this._disableRowLoaders();
        if (error.code <= 2) { // timeout
          alert("you have no gps or other problem - low accuracy");
        }
        if (error.code == 3) { // timeout
          alert("search timed out with low accuracy");
        }
      },
      {enableHighAccuracy: false, timeout: 5000, maximumAge: 1000}
    );
  },

  _enableRowLoader(rowData) {
    let rows = this.buildRowsFromResults(this._results);
    // console.log(rows);
    for (let i = 0; i < rows.length; i++) {
      if ((rows[i].place_id === rowData.place_id) || (rows[i].isCurrentLocation === true && rowData.isCurrentLocation === true)) {
        rows[i].isLoading = true;
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(rows),
        });
        break;
      }
    }
  },
  _disableRowLoaders() {
    if (this.isMounted()) {
      for (let i = 0; i < this._results.length; i++) {
        if (this._results[i].isLoading === true) {
          this._results[i].isLoading = false;
        }
      }
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults(this._results)),
      });
    }
  },
  _onPress(rowData) {
    // console.log(rowData.isPredefinedPlace);
    // if (rowData.isPredefinedPlace !== true && this.props.fetchDetails === true) {
    this.props.onPress(rowData, "MYTEST");
    if (false) {
      // if (rowData.isLoading === true) {
      //   // already requesting
      //   return;
      // }
      //
      // this._abortRequests();
      //
      // // display loader
      // this._enableRowLoader(rowData);
      //
      // // fetch details
      // const request = new XMLHttpRequest();
      // this._requests.push(request);
      // request.timeout = this.props.timeout;
      // request.ontimeout = this.props.onTimeout;
      // request.onreadystatechange = () => {
      //   if (request.readyState !== 4) {
      //     return;
      //   }
      //   if (request.status === 200) {
      //     const responseJSON = JSON.parse(request.responseText);
      //     if (responseJSON.status === 'OK') {
      //       if (this.isMounted()) {
      //         const details = responseJSON.result;
      //         this._disableRowLoaders();
      //         this._onBlur();
      //
      //         this.setState({
      //           text: rowData.properties.label,
      //         });
      //
      //         delete rowData.isLoading;
      //         this.props.onPress(rowData, details);
      //       }
      //     } else {
      //       this._disableRowLoaders();
      //       console.warn('mapzen places autocomplete: ' + responseJSON.status);
      //     }
      //   } else {
      //     this._disableRowLoaders();
      //     console.warn('mapzen places autocomplete: request could not be completed or has been aborted');
      //   }
      // };
      // request.open('GET', 'https://search.mapzen.com/v1/autocomplete?api_key=search-LVUGXaU&focus.point.lat=48.1&focus.point.lon=11.4&text=Am%20Sulzbogen%2020');
      // request.send();
    } else if (rowData.isCurrentLocation === true) {

      // display loader
      this._enableRowLoader(rowData);


      this.setState({
        text: rowData.properties.label,
      });
      this.triggerBlur(); // hide keyboard but not the results

      delete rowData.isLoading;

      this.getCurrentLocation();

    } else {
      this.setState({
        text: rowData.properties.label,
      });

      this._onBlur();

      delete rowData.isLoading;

      let predefinedPlace = this._getPredefinedPlace(rowData);

      // sending predefinedPlace as details for predefined places
      this.props.onPress(predefinedPlace, predefinedPlace);
    }
  },
  _results: [],
  _requests: [],

  _getPredefinedPlace(rowData) {
    if (rowData.isPredefinedPlace !== true) {
      return rowData;
    }
    for (let i = 0; i < this.props.predefinedPlaces.length; i++) {
      // if (this.props.predefinedPlaces[i].properties.label === rowData.properties.name) {
        return this.props.predefinedPlaces[i];
      // }
    }
    return rowData;
  },

  _filterResultsByTypes(responseJSON, types) {
    if (types.length === 0) return responseJSON.results;

    var results = [];
    for (let i = 0; i < responseJSON.results.length; i++) {
      let found = false;
      for (let j = 0; j < types.length; j++) {
        if (responseJSON.results[i].types.indexOf(types[j]) !== -1) {
          found = true;
          break;
        }
      }
      if (found === true) {
        results.push(responseJSON.results[i]);
      }
    }
    return results;
  },


  _requestNearby(latitude, longitude) {
    this._abortRequests();
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      const request = new XMLHttpRequest();
      this._requests.push(request);
      request.timeout = this.props.timeout;
      request.ontimeout = this.props.onTimeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          const responseJSON = JSON.parse(request.responseText);

          console.log(responseJSON);
          console.log("HÖÖ");
          this._disableRowLoaders();
          // console.log(responseJSON.features[0].properties);
          if (typeof responseJSON.features !== 'undefined') {
            if (this.isMounted()) {
              this._results = responseJSON.geocoding.features;
              this.setState({
                dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults(responseJSON.features)),
              });
            }
          }
          if (typeof responseJSON.error_message !== 'undefined') {
            console.warn('mapzen places autocomplete: ' + responseJSON.error_message);
          }
        } else {
          // console.warn("mapzen places autocomplete: request could not be completed or has been aborted");
        }
      };

      // https://mapzen.com/documentation/search/reverse/#distance-confidence-scores-for-the-results
      var mapzenSearch = "https://search.mapzen.com/v1/reverse?point.lat="+ latitude + "&point.lon=" + longitude;
      // console.log(mapzenSearch);
      request.open('GET', mapzenSearch);
      request.send();
    } else {
      this._results = [];
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults([])),
      });
    }
  },




  _request(text) {
    this._abortRequests();
    if (text.length >= this.props.minLength) {
      const request = new XMLHttpRequest();
      this._requests.push(request);
      request.timeout = this.props.timeout;
      request.ontimeout = this.props.onTimeout;
      request.onreadystatechange = () => {
        if (request.readyState !== 4) {
          return;
        }
        if (request.status === 200) {
          const responseJSON = JSON.parse(request.responseText);
          // console.log(responseJSON.features[0].properties);
          if (typeof responseJSON.features !== 'undefined') {
            if (this.isMounted()) {
              this._results = responseJSON.geocoding.features;
              this.setState({
                dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults(responseJSON.features)),
              });
            }
          }
          if (typeof responseJSON.error_message !== 'undefined') {
            console.warn('mapzen places autocomplete: ' + responseJSON.error_message);
          }
        } else {
          // console.warn("mapzen places autocomplete: request could not be completed or has been aborted");
        }
      };
      request.open('GET', 'https://search.mapzen.com/v1/autocomplete?api_key=search-LVUGXaU&focus.point.lat=48.1&focus.point.lon=11.4&text=' +encodeURIComponent(text) );
      request.send();
    } else {
      this._results = [];
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(this.buildRowsFromResults([])),
      });
    }
  },
  _onChangeText(text) {
    this._request(text);
    this.setState({
      text: text,
      listViewDisplayed: true,
    });
  },

  _getRowLoader() {
    return (
      <ActivityIndicator
        animating={true}
        size="small"
      />
    );
  },

  _renderLoader(rowData) {
    if (rowData.isLoading === true) {
      return (
        <View
          style={[defaultStyles.loader, this.props.styles.loader]}
        >
          {this._getRowLoader()}
        </View>
      );
    }
    return null;
  },

  _renderRow(rowData = {}) {
    // rowData.properties.name = rowData.properties.name || rowData.formatted_address || rowData.properties.region;
    // console.log(rowData);
    return (
      <TouchableHighlight
        onPress={() =>
          this._onPress(rowData)
        }
        underlayColor="#c8c7cc"
      >
        <View>
          <View style={[defaultStyles.row, this.props.styles.row, rowData.isPredefinedPlace ? this.props.styles.specialItemRow : {}]}>
            <Text
              style={[{flex: 1}, defaultStyles.description, this.props.styles.description, rowData.isPredefinedPlace ? this.props.styles.predefinedPlacesDescription : {}]}
              numberOfLines={1}
            >
              {rowData.properties.label}
            </Text>
            {this._renderLoader(rowData)}
          </View>
          <View style={[defaultStyles.separator, this.props.styles.separator]} />
        </View>
      </TouchableHighlight>
    );
  },

  _onBlur() {
    this.triggerBlur();
    this.setState({listViewDisplayed: false});
  },

  _onFocus() {
    this.setState({listViewDisplayed: true});
  },

  _getListView() {
    if ((this.state.text !== '' || this.props.predefinedPlaces.length || this.props.currentLocation === true) && this.state.listViewDisplayed === true) {
      // console.log(this.state.dataSource);
      return (
        <ListView
          keyboardShouldPersistTaps={true}
          keyboardDismissMode="on-drag"
          style={[defaultStyles.listView, this.props.styles.listView]}
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
          automaticallyAdjustContentInsets={false}

          {...this.props}
        />
      );
    }

    if(this.props.enablePoweredByContainer) {
      return (
        <View
          style={[defaultStyles.poweredContainer, this.props.styles.poweredContainer]}
        >
        </View>
      );
    }

    return null;
  },
  render() {
    let { onChangeText, onFocus, ...userProps } = this.props.textInputProps;
    return (
      <View
        style={[defaultStyles.container, this.props.styles.container]}
      >
        <View
          style={[defaultStyles.textInputContainer, this.props.styles.textInputContainer]}
        >
          <TextInput
            { ...userProps }
            ref="textInput"
            autoFocus={this.props.autoFocus}
            style={[defaultStyles.textInput, this.props.styles.textInput]}
            onChangeText={onChangeText ? text => {this._onChangeText(text); onChangeText(text)} : this._onChangeText}
            value={this.state.text}
            placeholder={this.props.placeholder}
            placeholderTextColor={this.props.placeholderTextColor}
            onFocus={onFocus ? () => {this._onFocus(); onFocus()} : this._onFocus}
            clearButtonMode="while-editing"
          />
        </View>
        {this._getListView()}
      </View>
    );
  },
});


// this function is still present in the library to be retrocompatible with version < 1.1.0
const create = function create(options = {}) {
  return React.createClass({
    render() {
      return (
        <MapzenPlacesAutocomplete ref="MapzenPlacesAutocomplete"
          {...options}
        />
      );
    },
  });
};


module.exports = {MapzenPlacesAutocomplete, create};

